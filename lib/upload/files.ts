import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
export class UploadError extends Error {}
export function sanitizeFilename(name: string) {
  if (!name || name.includes('\0') || name.includes('..') || /^[\\/]/.test(name) || /^[a-z]:/i.test(name)) throw new UploadError('Unsafe filename. Choose a file without path components.');
  const leaf = name.replace(/\\/g, '/').split('/').at(-1) ?? '';
  const safe = leaf.normalize('NFKC').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120);
  if (!safe || safe === '.' || safe.startsWith('.')) throw new UploadError('Choose a file with a visible filename.');
  return safe;
}
export function validateContent(bytes: Uint8Array, name: string, mode: 'vulnerable' | 'secured', max: number) {
  if (!bytes.length) throw new UploadError('The selected file is empty.');
  if (bytes.length > max) throw new UploadError('The file exceeds the upload size limit.');
  if (mode === 'secured') {
    if (!name.toLowerCase().endsWith('.txt')) throw new UploadError('Secured mode accepts plain-text .txt files only.');
    if (bytes.some(b => b === 0 || (b < 32 && ![9, 10, 13].includes(b)))) throw new UploadError('The file must contain plain text.');
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new UploadError('The file must be valid UTF-8 text.'); }
    if (Buffer.from(bytes).includes(Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'))) throw new UploadError('The training signature is blocked in secured mode.');
  }
}
export function sha256(bytes: Uint8Array) { return createHash('sha256').update(bytes).digest('hex'); }
export async function saveUpload(bytes: Uint8Array, directory: string) {
  await mkdir(directory, { recursive: true, mode: 0o750 });
  const storedName = randomUUID() + '.artifact';
  const storagePath = path.join(path.resolve(directory), storedName);
  const file = await open(storagePath, 'wx', 0o640);
  const hash = createHash('sha256');
  try {
    for (let offset = 0; offset < bytes.length; offset += 65536) {
      const chunk = bytes.subarray(offset, offset + 65536);
      await file.writeFile(chunk);
      hash.update(chunk);
    }
    await file.sync();
  } catch (error) { await file.close(); await unlink(storagePath).catch(() => {}); throw error; }
  await file.close();
  return { storedName, storagePath, sha256: hash.digest('hex') };
}
