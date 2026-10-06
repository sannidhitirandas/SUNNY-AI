import path from 'path';

export interface UploadedAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
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
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(data);
  if (!match) throw new Error('Invalid attachment encoding.');
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
}

function hasMagic(buffer: Buffer, ext: string) {
  if (ext === '.pdf') return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (['.png'].includes(ext)) return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (['.jpg', '.jpeg'].includes(ext)) return buffer.subarray(0, 3).equals(Buffer.from([255,216,255]));
  if (ext === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
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

  let totalSize = 0;
  let extractedTotal = 0;
  const processed: ProcessedAttachment[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid attachment.');
    const item = raw as Partial<UploadedAttachment>;
    const name = typeof item.name === 'string' ? safeName(item.name) : 'attachment';
    const ext = path.extname(name).toLowerCase();
    if (!allowedExtensions.has(ext) || (typeof item.type === 'string' && item.type && !allowedMimeTypes.has(item.type.toLowerCase()))) {
      throw new Error(`Unsupported file type: ${ext || 'unknown'}.`);
    }
    if (typeof item.data !== 'string') throw new Error(`${name} is missing file data.`);

    const decoded = decodeDataUrl(item.data);
    const size = decoded.buffer.length;
    if (size === 0) throw new Error(`${name} is empty.`);
    if (size > MAX_FILE_SIZE) throw new Error(`${name} is larger than 5 MB.`);
    totalSize += size;
    if (totalSize > MAX_TOTAL_SIZE) throw new Error('Attachments must be 10 MB or smaller in total.');

    const declaredType = typeof item.type === 'string' ? item.type.toLowerCase() : '';
    if (declaredType && decoded.mimeType !== declaredType) throw new Error(`${name} has an invalid MIME type.`);
    if (!hasMagic(decoded.buffer, ext)) throw new Error(`${name} failed file validation.`);

    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      processed.push({ name, kind: 'image', mimeType: decoded.mimeType, data: decoded.buffer.toString('base64') });
      continue;
    }

    const text = await extractText(decoded.buffer, ext);
    if (!text) throw new Error(`${name} does not contain readable content.`);
    const clipped = text.slice(0, MAX_EXTRACTED_PER_FILE);
    extractedTotal += clipped.length;
    if (extractedTotal > MAX_EXTRACTED_TOTAL) throw new Error('The combined extracted file content is too large. Please attach fewer or smaller files.');
    processed.push({ name, kind: 'text', mimeType: decoded.mimeType, text: clipped });
  }

  return processed;
}

export const ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxFileSize: MAX_FILE_SIZE,
  maxTotalSize: MAX_TOTAL_SIZE,
};
