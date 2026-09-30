import { test, expect } from '@playwright/test';
import { ENV_PORT, WEBHOOK_PORT } from '../playwright.config';
import { describe as describeApp, applySchema } from '../src/lib/apply';

// Runs against the second dev server (analytics IDs set, SMTP refusing, webhook mocked).
const ENV = `http://localhost:${ENV_PORT}`;
const HOOK = `http://localhost:${WEBHOOK_PORT}`;

const application = (agency: string) => ({
  agency,
  name: 'Pat Tester',
  email: 'pat@example.com',
  phone: '(555) 010-0000',
  states: ['TX'],
  agents: '12',
  verticals: ['Final Expense'],
  program: 'Pay per call',
  takeCalls: 'In the dashboard',
  ageFrom: '50',
  ageTo: '80',
  buffer: '90 seconds',
  consent: true,
  utm_source: 'google',
  landing: '/pay-per-call',
  company_website: '',
  started: Date.now() - 10_000,
});

const received = async (agency: string) =>
  ((await (await fetch(HOOK)).json()) as Record<string, unknown>[]).filter(
    (r) => r.agency === agency,
  );

test('analytics scripts are absent when the env is empty', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  expect(html).not.toContain('googletagmanager.com');
  expect(html).not.toContain('fbevents.js');
  expect(await page.evaluate(() => typeof (window as { gtag?: unknown }).gtag)).toBe('undefined');
});

test('analytics scripts load when their env vars are set', async ({ page }) => {
  await page.route(/googletagmanager\.com|connect\.facebook\.net/, (r) =>
    r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
  );
  await page.goto(`${ENV}/`);
  const html = await page.content();
  expect(html).toContain('googletagmanager.com/gtag/js?id=G-TEST123');
  expect(html).toContain('gtag(\'config\',"AW-TEST123")');
  expect(html).toContain('fbevents.js');
  expect(await page.evaluate(() => (window as { llpAdsLead?: string }).llpAdsLead)).toBe(
    'AW-TEST123/leadLabel',
  );
});

test('privacy page names the enabled analytics tools', async ({ page }) => {
  await page.goto(`${ENV}/privacy`);
  await expect(page.locator('main')).toContainText(
    'Google Analytics, Meta Pixel, and Google Ads to measure visits and ad performance',
  );
  await page.goto('/privacy');
  await expect(page.locator('main')).toContainText('sets no cookies and uses no analytics');
});

test('apply returns 200 when SMTP fails but the webhook accepts', async ({ request }) => {
  const agency = `Webhook Agency ${Date.now()}`;
  const res = await request.post(`${ENV}/api/apply`, { data: application(agency) });
  expect(res.status()).toBe(200);
  const [hook] = await received(agency);
  expect(hook).toMatchObject({
    type: 'application',
    agency,
    program: 'Pay per call',
    ageFrom: 50,
    ageTo: 80,
    buffer: '90 seconds',
    utm_source: 'google',
  });
  expect(typeof hook.submittedAt).toBe('string');
});

test('partial leads reach the webhook', async ({ request }) => {
  const agency = `Partial Agency ${Date.now()}`;
  const { name, email, phone, consent, utm_source, company_website, started } = application(agency);
  const res = await request.post(`${ENV}/api/partial`, {
    data: { agency, name, email, phone, consent, utm_source, company_website, started },
  });
  expect(res.status()).toBe(200);
  const [hook] = await received(agency);
  expect(hook).toMatchObject({ type: 'partial', agency, email: 'pat@example.com' });
  expect(hook).not.toHaveProperty('program');
});

test('notification rows include ages, buffer and attribution', () => {
  const parsed = applySchema.parse(application('Rows Agency'));
  const rows = Object.fromEntries(describeApp(parsed));
  expect(rows['Caller ages']).toBe('50–80');
  expect(rows['Buffer time']).toBe('90 seconds');
  expect(rows['Source']).toBe('google');
  expect(rows['Landing page']).toBe('/pay-per-call');
  expect(rows['Campaign']).toBe('—');
  expect(rows['gclid']).toBe('—');
  const none = Object.fromEntries(
    describeApp(applySchema.parse({ ...application('X'), ageFrom: '', ageTo: '', buffer: '' })),
  );
  expect(none['Caller ages']).toBe('—');
  expect(none['Buffer time']).toBe('—');
});
