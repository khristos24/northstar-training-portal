import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 90000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8080', trace: 'off', screenshot: 'off', ...devices['Desktop Chrome'], channel: 'chrome' },
  webServer: [
    { command: 'npx tsx scripts/test-server.ts --production', url: 'http://127.0.0.1:8080/health', timeout: 120000, reuseExistingServer: false },
    { command: 'npx tsx scripts/test-server.ts --production --secured', url: 'http://127.0.0.1:8081/health', timeout: 120000, reuseExistingServer: false }
  ]
});
