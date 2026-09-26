import bcrypt from 'bcrypt';
export async function hashPassword(password: string) {
  if (!password || Buffer.byteLength(password) > 72) throw new Error('Password must contain 1–72 bytes');
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, hash: string) {
  if (!password || Buffer.byteLength(password) > 72) return false;
  return bcrypt.compare(password, hash);
}
