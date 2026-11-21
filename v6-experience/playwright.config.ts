import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'docs/e2e-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4176',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
    trace: 'off',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'kiosk-1920',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'kiosk-1366',
      use: { viewport: { width: 1366, height: 768 } },
    },
  ],
});
