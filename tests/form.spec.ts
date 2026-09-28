import { test, expect, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();
const send = (page: Page) => page.getByRole('button', { name: 'Send application' }).click();
const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 2, name, exact: true });

async function fillToReview(page: Page) {
  await page.getByLabel('Agency name').fill('Test Agency');
  await page.getByLabel('Your name').fill('Pat Tester');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('pat@example.com');
  await page.getByLabel('Mobile phone').fill('(555) 010-0000');
  await next(page);
  await expect(heading(page, 'Coverage')).toBeFocused();

  await page.getByLabel('Search states').fill('tex');
  await page.getByLabel('Texas').check();
  await page.getByLabel('Number of licensed agents').fill('12');
  await page.getByLabel('Final Expense').check();
  await next(page);
  await expect(heading(page, 'Program')).toBeVisible();

  await page.getByLabel('Pay per call').check();
  await page.getByLabel('In the portal').check();
  await next(page);
  await expect(heading(page, 'Review')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/get-started');
});

test('Next is blocked while the current step is invalid', async ({ page }) => {
  await next(page);
  await expect(page.locator('#err-agency')).toHaveText('Enter your agency name.');
  await expect(page.locator('#err-email')).toBeVisible();
  // Later steps' errors are not shown yet.
  await expect(page.locator('#err-states')).toBeHidden();
  await expect(page.getByLabel('Agency name')).toBeFocused();
  await expect(heading(page, 'Your agency')).toBeVisible();

  await page.getByLabel('Agency name').fill('Test Agency');
  await page.getByLabel('Your name').fill('Pat Tester');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('pat@example.com');
  await page.getByLabel('Mobile phone').fill('(555) 010-0000');
  await next(page);
  await next(page);
  await expect(page.locator('#err-states')).toHaveText('Choose at least one state.');
  await expect(page.locator('#err-verticals')).toBeVisible();
  await expect(heading(page, 'Coverage')).toBeVisible();
});

test('Back keeps entries; states select all and clear', async ({ page }) => {
  await page.getByLabel('Agency name').fill('Test Agency');
  await page.getByLabel('Your name').fill('Pat Tester');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('pat@example.com');
  await page.getByLabel('Mobile phone').fill('(555) 010-0000');
  await next(page);
  await page.getByRole('button', { name: 'Select all' }).click();
  await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(51);
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByLabel('Agency name')).toHaveValue('Test Agency');
});

test('review summarises entries and Edit returns to the step', async ({ page }) => {
  await fillToReview(page);
  const review = page.locator('[data-review]');
  await expect(review).toContainText('Test Agency');
  await expect(review).toContainText('Texas (TX)');
  await expect(review).toContainText('Pay per call');
  await review.getByRole('button', { name: 'Edit Coverage' }).click();
  await expect(heading(page, 'Coverage')).toBeFocused();
  await expect(page.getByLabel('Number of licensed agents')).toHaveValue('12');
});

test('consent is required on the review step', async ({ page }) => {
  await fillToReview(page);
  await send(page);
  await expect(page.locator('#err-consent')).toBeVisible();
});

test('rejects the honeypot', async ({ page }) => {
  await fillToReview(page);
  await page.getByLabel(/I agree that Life Leads Plus/).check();
  await page.locator('#company_website').fill('https://spam.example');
  await page.waitForTimeout(3100);
  await send(page);
  await expect(page.getByRole('status')).toContainText('couldn’t accept');
  await expect(page.locator('#apply-form')).toBeVisible();
});

test('rejects submissions faster than 3 seconds', async ({ page }) => {
  // Stamp `started` as "just now" so the server-side timing check fires however long filling took.
  await page.route('/api/apply', (route) =>
    route.continue({
      postData: JSON.stringify({ ...route.request().postDataJSON(), started: Date.now() }),
    }),
  );
  await fillToReview(page);
  await page.getByLabel(/I agree that Life Leads Plus/).check();
  await send(page);
  await expect(page.getByRole('status')).toContainText('couldn’t accept');
});

test('succeeds against the mocked SMTP transport', async ({ page }) => {
  await fillToReview(page);
  await page.getByLabel(/I agree that Life Leads Plus/).check();
  await page.waitForTimeout(3100);
  await send(page);
  await expect(page.getByText('Thanks — we got it.')).toBeVisible();
  await expect(page.locator('#apply-form')).toHaveCount(0);
});
