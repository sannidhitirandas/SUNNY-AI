import assert from 'node:assert/strict';
import test from 'node:test';
import { processAttachments } from '../server/fileAttachments';

function multipart(name: string, mimetype: string, bytes: Buffer) {
  return {
    fieldname: 'attachments',
    originalname: name,
    mimetype,
    buffer: bytes,
    size: bytes.length,
  };
}

test('accepts supported UTF-8 text attachments with matching MIME types', async () => {
  const files = [
    multipart('notes.txt', 'text/plain', Buffer.from('Hello Sunny', 'utf8')),
    multipart('table.csv', 'text/csv', Buffer.from('name,value\nSunny,1', 'utf8')),
    multipart('data.json', 'application/json', Buffer.from('{"ok":true}', 'utf8')),
    multipart('readme.md', 'text/markdown', Buffer.from('# Hello', 'utf8')),
  ];

  const processed = await processAttachments(files);
  assert.equal(processed.length, 4);
  assert.ok(processed.every((item) => item.kind === 'text'));
});

test('rejects a text extension containing binary or malformed UTF-8 bytes', async () => {
  await assert.rejects(
    processAttachments([multipart('notes.txt', 'text/plain', Buffer.from([0x48, 0x00, 0x69]))]),
    /failed file validation/
  );
  await assert.rejects(
    processAttachments([multipart('notes.txt', 'text/plain', Buffer.from([0xc3, 0x28]))]),
    /failed file validation/
  );
});

test('rejects document extensions when their content signature is missing', async () => {
  const invalidDocuments = [
    multipart('report.pdf', 'application/pdf', Buffer.from('not a PDF')),
    multipart('report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.from('not a ZIP')),
    multipart('sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from('not a ZIP')),
    multipart('legacy.xls', 'application/vnd.ms-excel', Buffer.from('not an OLE workbook')),
  ];

  for (const file of invalidDocuments) {
    await assert.rejects(processAttachments([file]), /failed file validation/);
  }
});

test('rejects MIME types that do not match the filename extension', async () => {
  await assert.rejects(
    processAttachments([multipart('notes.txt', 'image/png', Buffer.from('plain text'))]),
    /MIME type that does not match/
  );
});

test('rejects image bytes when the extension claims a different image format', async () => {
  const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]);
  await assert.rejects(
    processAttachments([multipart('picture.png', 'image/jpeg', jpegBytes)]),
    /failed file validation/
  );
});

test('accepts image attachments by matching their actual signature', async () => {
  const pngBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const [processed] = await processAttachments([
    multipart('picture.png', 'application/octet-stream', pngBytes),
  ]);

  assert.equal(processed.kind, 'image');
  assert.equal(processed.mimeType, 'image/png');
  assert.equal(processed.data, pngBytes.toString('base64'));
});
