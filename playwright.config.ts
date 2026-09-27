import { defineConfig } from '@playwright/test';

const PORT = 4322;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, browserName: 'chromium' },
  webServer: {
    command: `npx astro dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    env: {
      SITE_URL: 'https://lifeleadsplus.example',
      PORTAL_URL: 'https://portal.example.com',
      SMTP_HOST: 'mock',
      SMTP_FROM: 'Life Leads Plus <no-reply@example.com>',
      APPLY_TO_EMAIL: 'applications@example.com',
    },
  },
});
