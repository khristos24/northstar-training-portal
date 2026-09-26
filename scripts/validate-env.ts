import 'dotenv/config';
import { getEnv } from '../lib/validation/env';
try { getEnv(); } catch (error) { console.error((error as Error).message); process.exit(1); }
