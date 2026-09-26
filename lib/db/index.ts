import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseUrl } from '../validation/env';
const globalDb = globalThis as unknown as { northstarDb?: PrismaClient };
export function db() {
  if (!globalDb.northstarDb) globalDb.northstarDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl(), max: 10, connectionTimeoutMillis: 3000, query_timeout: 10000 }), log: [] });
  return globalDb.northstarDb;
}
