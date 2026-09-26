import 'dotenv/config';
import { defineConfig } from 'prisma/config';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DATABASE_URL ?? ('postgresql://northstar:' + encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '') + '@' + (process.env.POSTGRES_HOST ?? '127.0.0.1') + ':' + (process.env.POSTGRES_PORT ?? '5432') + '/northstar') }
});
