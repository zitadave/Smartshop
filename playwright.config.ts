import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://moonlit-kheer-826ac2.netlify.app',
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    actionTimeout: 10000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'Mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'Desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
