import { defineConfig } from '@playwright/test';
import baseline from './playwright.config';

export default defineConfig({
  ...baseline,
  testMatch: '**/v5.spec.ts',
  timeout: 45000,
  outputDir: 'test-results-v5',
  reporter: [['list'], ['json', { outputFile: 'docs/v5/test-results.json' }]],
  use: { ...baseline.use, baseURL: 'http://127.0.0.1:5175' },
  webServer: { command: 'npm run dev -- --port 5175', url: 'http://127.0.0.1:5175', reuseExistingServer: true },
});
