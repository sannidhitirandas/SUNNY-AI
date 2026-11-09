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

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv', 'application/json', 'text/markdown',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png', 'image/jpeg', 'image/webp',
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

function hasMagic(buffer: Buffer, ext: string) {
  if (ext === '.pdf') return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return detectImageMime(buffer) !== null;
  if (['.docx', '.xlsx'].includes(ext)) return buffer.subarray(0, 2).toString('hex') === '504b';
  return true;
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

    let buffer: Buffer;
    let name: string;
    let mimeType: string;

    // Support both Base64 JSON (legacy) and Multipart binary (new)
    if ('buffer' in raw && Buffer.isBuffer(raw.buffer)) {
      // MultipartAttachment
      const multipart = raw as any;
      buffer = multipart.buffer;
      name = safeName(multipart.originalname);
      mimeType = multipart.mimetype;
    } else {
      // UploadedAttachment (Base64)
      const item = raw as Partial<UploadedAttachment>;
      name = typeof item.name === 'string' ? safeName(item.name) : 'attachment';
      const decoded = decodeDataUrl(item.data || '');
      buffer = decoded.buffer;
      mimeType = decoded.mimeType;
    }

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

    if (detectedImageMime && !imageExtension) {
      throw new Error(`${name} failed file validation.`);
    }
    if (!detectedImageMime && declaredType && !unknownClientMime &&
      decoded.mimeType !== 'application/octet-stream' && decoded.mimeType !== declaredType) {
      throw new Error(`${name} has an invalid MIME type.`);
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
  }

  return processed;
}

export const ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxFileSize: MAX_FILE_SIZE,
  maxTotalSize: MAX_TOTAL_SIZE,
};
