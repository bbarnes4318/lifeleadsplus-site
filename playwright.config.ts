import { defineConfig } from '@playwright/test';

const PORT = 4322;
// A second dev server with every optional integration switched on: analytics IDs, a webhook
// (tests/webhook-mock.mjs) and an SMTP host that refuses connections. Used by tests/env.spec.ts.
export const ENV_PORT = 4323;
export const WEBHOOK_PORT = 4390;

const base = {
  SITE_URL: 'https://lifeleadsplus.example',
  PORTAL_URL: 'https://portal.example.com',
  SMTP_FROM: 'Life Leads Plus <no-reply@example.com>',
  APPLY_TO_EMAIL: 'applications@example.com',
};

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, browserName: 'chromium' },
  webServer: [
    {
      command: `npx astro dev --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      env: { ...base, SMTP_HOST: 'mock' },
    },
    {
      command: `node tests/webhook-mock.mjs`,
      url: `http://localhost:${WEBHOOK_PORT}`,
      reuseExistingServer: false,
      env: { PORT: String(WEBHOOK_PORT) },
    },
    {
      command: `npx astro dev --port ${ENV_PORT}`,
      url: `http://localhost:${ENV_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      env: {
        ...base,
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: '1',
        APPLY_WEBHOOK_URL: `http://localhost:${WEBHOOK_PORT}/hook`,
        PUBLIC_GA4_ID: 'G-TEST123',
        PUBLIC_META_PIXEL_ID: '1234567890',
        PUBLIC_GOOGLE_ADS_ID: 'AW-TEST123',
        PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'leadLabel',
      },
    },
  ],
});
