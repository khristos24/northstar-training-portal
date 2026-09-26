import { z } from 'zod';
const bool = z.enum(['true', 'false']).default('false').transform(v => v === 'true');
const seedPassword = z.string().min(1).refine(v => Buffer.byteLength(v) <= 72, 'must be at most 72 bytes');
export const envSchema = z.object({
  LAB_MODE: z.enum(['vulnerable', 'secured']).default('vulnerable'),
  FINANCE_SEED_PASSWORD: seedPassword,
  EMPLOYEE_SEED_PASSWORD: seedPassword,
  ADMIN_SEED_PASSWORD: seedPassword,
  SESSION_SECRET: z.string().min(32),
  POSTGRES_PASSWORD: z.string().min(16),
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().default('127.0.0.1'),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  APP_ORIGIN: z.string().url().default('http://localhost:8080'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  BIND_HOST: z.string().default('127.0.0.1'),
  HTTPS_ENABLED: bool,
  TRUST_PROXY: bool,
  TRUSTED_PROXY_IPS: z.string().default(''),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_DIR: z.string().default('./logs'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().min(1).max(10 * 1024 * 1024).default(1048576),
  SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8)
});
export function parseEnv(source: Record<string, string | undefined>) {
  const result = envSchema.safeParse(source);
  if (!result.success) throw new Error('Invalid environment: ' + result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; '));
  const env = result.data;
  if (env.TRUST_PROXY && !env.TRUSTED_PROXY_IPS.trim()) throw new Error('TRUSTED_PROXY_IPS is required when TRUST_PROXY=true');
  if (new URL(env.APP_ORIGIN).protocol === 'https:' && !env.HTTPS_ENABLED) throw new Error('HTTPS_ENABLED must be true for an HTTPS APP_ORIGIN');
  return env;
}
export function getEnv() { return parseEnv(process.env); }
export function databaseUrl() {
  const e = getEnv();
  return e.DATABASE_URL ?? 'postgresql://northstar:' + encodeURIComponent(e.POSTGRES_PASSWORD) + '@' + e.POSTGRES_HOST + ':' + e.POSTGRES_PORT + '/northstar';
}
