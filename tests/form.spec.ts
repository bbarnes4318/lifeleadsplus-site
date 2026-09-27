import { test, expect, type Page } from '@playwright/test';

async function fillValid(page: Page) {
  await page.getByLabel('Agency name').fill('Test Agency');
  await page.getByLabel('Your name').fill('Pat Tester');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('pat@example.com');
  await page.getByLabel('Mobile phone').fill('(555) 010-0000');
  await page.getByLabel('Search states').fill('tex');
  await page.getByLabel('Texas').check();
  await page.getByLabel('Number of licensed agents').fill('12');
  await page.getByLabel('Final Expense').check();
  await page.getByLabel('Pay per call').check();
  await page.getByLabel('In the portal').check();
  await page.getByLabel(/I agree that Life Leads Plus/).check();
}

const send = (page: Page) => page.getByRole('button', { name: 'Send application' }).click();

test.beforeEach(async ({ page }) => {
  await page.goto('/get-started');
});

test('shows inline errors when empty', async ({ page }) => {
  await send(page);
  await expect(page.locator('#err-agency')).toHaveText('Enter your agency name.');
  await expect(page.locator('#err-states')).toHaveText('Choose at least one state.');
  await expect(page.locator('#err-verticals')).toBeVisible();
  await expect(page.locator('#err-program')).toBeVisible();
  await expect(page.locator('#err-consent')).toBeVisible();
  await expect(page.getByLabel('Agency name')).toBeFocused();
});

test('rejects the honeypot', async ({ page }) => {
  await fillValid(page);
  await page.locator('#company_website').fill('https://spam.example');
  await page.waitForTimeout(3100);
  await send(page);
  await expect(page.getByRole('status')).toContainText('couldn’t accept');
  await expect(page.locator('#apply-form')).toBeVisible();
});

test('rejects submissions faster than 3 seconds', async ({ page }) => {
  await fillValid(page);
  await send(page);
  await expect(page.getByRole('status')).toContainText('couldn’t accept');
});

test('succeeds against the mocked SMTP transport', async ({ page }) => {
  await fillValid(page);
  await expect(page.getByRole('button', { name: 'Remove Texas' })).toBeVisible();
  await page.waitForTimeout(3100);
  await send(page);
  await expect(page.getByText('Thanks — we got it.')).toBeVisible();
  await expect(page.locator('#apply-form')).toHaveCount(0);
});
