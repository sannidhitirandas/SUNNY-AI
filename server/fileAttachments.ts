import path from 'path';

export interface UploadedAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface MultipartAttachment {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ProcessedAttachment {
  name: string;
  kind: 'text' | 'image';
  mimeType: string;
  text?: string;
  data?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const MAX_EXTRACTED_PER_FILE = 30000;
const MAX_EXTRACTED_TOTAL = 80000;

const allowedExtensions = new Set([
  '.pdf', '.docx', '.txt', '.csv', '.xls', '.xlsx',
  '.json', '.md', '.markdown', '.png', '.jpg', '.jpeg', '.webp',
]);



function safeName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120) || 'attachment';
}

function decodeDataUrl(data: string) {
  const trimmed = data.trim();
  let mimeType = 'application/octet-stream';
  let base64Str = trimmed;

  if (trimmed.startsWith('data:')) {
    const match = /^data:([^;,]*);base64,([\s\S]+)$/.exec(trimmed);
    if (match) {
      if (match[1] && match[1].trim()) {
        mimeType = match[1].toLowerCase().trim();
      }
      base64Str = match[2].replace(/\s+/g, '');
    } else {
      throw new Error('Invalid attachment encoding.');
    }
  } else {
    base64Str = trimmed.replace(/\s+/g, '');
  }

  return { mimeType, buffer: Buffer.from(base64Str, 'base64') };
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([255,216,255]))) return 'image/jpeg';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const MIME_TYPES_BY_EXTENSION: Record<string, Set<string>> = {
  '.pdf': new Set(['application/pdf']),
  '.docx': new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  '.txt': new Set(['text/plain']),
  '.csv': new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain']),
  '.xls': new Set(['application/vnd.ms-excel', 'application/x-ole-storage']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  '.json': new Set(['application/json', 'text/json', 'text/plain']),
  '.md': new Set(['text/markdown', 'text/plain']),
  '.markdown': new Set(['text/markdown', 'text/plain']),
  '.png': new Set(['image/png']),
  '.jpg': new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
  '.webp': new Set(['image/webp']),
};

function hasMagic(buffer: Buffer, ext: string): boolean {
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';

  const imageMime = detectImageMime(buffer);
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    return imageMime === MIME_TYPES_BY_EXTENSION[ext]?.values().next().value;
  }

  if (ext === '.docx' || ext === '.xlsx') {
    // ZIP local-file header. The extension and MIME checks below further
    // constrain this to the document formats Sunny actually supports.
    return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }

  if (ext === '.xls') {
    // OLE Compound File signature used by legacy Excel workbooks.
    return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }

  if (['.txt', '.csv', '.json', '.md', '.markdown'].includes(ext)) {
    // Reject binary payloads masquerading as text and malformed UTF-8.
    if (buffer.includes(0)) return false;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

async function extractText(buffer: Buffer, ext: string): Promise<string> {
  if (['.txt', '.csv', '.json', '.md', '.markdown'].includes(ext)) {
    const raw = buffer.toString('utf8').replace(/^\uFEFF/, '').trim();
    if (ext === '.json') {
      try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
    }
    return raw;
  }

  if (ext === '.pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text?.trim() || '';
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || '';
  }

  if (ext === '.xls' || ext === '.xlsx') {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join('\n\n').trim();
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function processAttachments(input: unknown): Promise<ProcessedAttachment[]> {
  if (!Array.isArray(input) || input.length === 0) return [];
  if (input.length > 3) throw new Error('You can attach up to 3 files per message.');

  // Validate and decode every attachment first. Keep aggregate byte limits
  // independent of processing order so parallel extraction cannot bypass them.
  let totalSize = 0;
  const decodedItems: Array<{
    name: string;
    ext: string;
    decoded: ReturnType<typeof decodeDataUrl>;
    detectedImageMime: string | null;
  }> = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid attachment.');

    let name: string;
    let decoded: ReturnType<typeof decodeDataUrl>;

    // Support both Base64 JSON (legacy) and Multipart binary (new).
    // Keep the decoded payload shape identical for both upload paths.
    if ('buffer' in raw && Buffer.isBuffer(raw.buffer)) {
      const multipart = raw as MultipartAttachment;
      decoded = {
        buffer: Buffer.from(multipart.buffer),
        mimeType: multipart.mimetype || 'application/octet-stream',
      };
      name = safeName(multipart.originalname);
    } else {
      const item = raw as Partial<UploadedAttachment>;
      name = typeof item.name === 'string' ? safeName(item.name) : 'attachment';
      decoded = decodeDataUrl(item.data || '');
    }

    const buffer = decoded.buffer;
    const declaredType = decoded.mimeType.toLowerCase().trim();
    const unknownClientMime = !declaredType || declaredType === 'application/octet-stream';

    const ext = path.extname(name).toLowerCase();
    const imageExtension = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    if (!allowedExtensions.has(ext)) {
      throw new Error(`Unsupported file type: ${ext || 'unknown'}.`);
    }

    const size = buffer.length;
    if (size === 0) throw new Error(`${name} is empty.`);
    if (size > MAX_FILE_SIZE) throw new Error(`${name} is larger than 50 MB.`);
    totalSize += size;
    if (totalSize > MAX_TOTAL_SIZE) throw new Error('Attachments must be 50 MB or smaller in total.');

    const detectedImageMime = detectImageMime(buffer);
    const expectedMimeTypes = MIME_TYPES_BY_EXTENSION[ext];

    // Validate the actual bytes, not just the filename or browser-provided MIME.
    if (!hasMagic(buffer, ext)) {
      throw new Error(`${name} failed file validation.`);
    }
    if (imageExtension && detectedImageMime !== expectedMimeTypes?.values().next().value) {
      throw new Error(`${name} failed file validation.`);
    }
    if (!unknownClientMime && !expectedMimeTypes?.has(declaredType)) {
      throw new Error(`${name} has a MIME type that does not match its file extension.`);
    }

    decodedItems.push({ name, ext, decoded, detectedImageMime });
  }

  // Image preparation and document extraction are independent. Run them
  // concurrently instead of making each attachment wait for the previous one.
  const processed = await Promise.all(decodedItems.map(async ({ name, ext, decoded, detectedImageMime }) => {
    if (detectedImageMime) {
      return {
        name,
        kind: 'image' as const,
        mimeType: detectedImageMime,
        data: decoded.buffer.toString('base64'),
      };
    }

    const text = await extractText(decoded.buffer, ext);
    if (!text) throw new Error(`${name} does not contain readable content.`);
    return {
      name,
      kind: 'text' as const,
      mimeType: decoded.mimeType,
      text: text.slice(0, MAX_EXTRACTED_PER_FILE),
    };
  }));

  const extractedTotal = processed.reduce(
    (total, item) => total + (item.kind === 'text' ? item.text?.length ?? 0 : 0),
    0,
  );
  if (extractedTotal > MAX_EXTRACTED_TOTAL) {
    throw new Error('The combined extracted file content is too large. Please attach fewer or smaller files.');
  }

  return processed;
}

export const ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxFileSize: MAX_FILE_SIZE,
  maxTotalSize: MAX_TOTAL_SIZE,
};
