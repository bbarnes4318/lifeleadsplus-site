import { test, expect, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();
const send = (page: Page) => page.getByRole('button', { name: 'Get my rate' }).click();
const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 2, name, exact: true });

export async function fillStep1(page: Page, agency = 'Test Agency', consent = true) {
  await page.getByLabel('Agency name').fill(agency);
  await page.getByLabel('Your name').fill('Pat Tester');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('pat@example.com');
  await page.getByLabel('Mobile phone').fill('(555) 010-0000');
  if (consent) await page.getByLabel(/I agree that Life Leads Plus/).check();
}

export async function fillToProgram(page: Page, agency?: string) {
  await fillStep1(page, agency);
  await next(page);
  await expect(heading(page, 'Coverage')).toBeFocused();
  await page.getByLabel('Search states').fill('tex');
  await page.getByLabel('Texas').check({ force: true });
  await page.getByLabel('Number of licensed agents').fill('12');
  await page.getByLabel('Final Expense').check({ force: true });
  await next(page);
  await expect(heading(page, 'Program')).toBeVisible();
}

test.describe('application form', () => {
  test.beforeEach(async ({ page }) => {
    // Keep these tests from posting partial leads (and using up the endpoint's rate limit).
    await page.route('/api/partial', (route) => route.fulfill({ status: 200, body: '{}' }));
  });

  test('has three steps and blocks Next while the step is invalid', async ({ page }) => {
    await page.goto('/get-started');
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Form steps' }).getByRole('listitem')).toHaveText([
      'Your agency',
      'Coverage',
      'Program',
    ]);
    await next(page);
    await expect(page.locator('#err-agency')).toHaveText('Enter your agency name.');
    await expect(page.locator('#err-email')).toBeVisible();
    await expect(page.locator('#err-states')).toBeHidden();
    await expect(page.getByLabel('Agency name')).toBeFocused();

    await fillStep1(page);
    await next(page);
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await next(page);
    await expect(page.locator('#err-states')).toHaveText('Choose at least one state.');
    await expect(page.locator('#err-verticals')).toBeVisible();
  });

  test('consent is required on step 1', async ({ page }) => {
    await page.goto('/get-started');
    await fillStep1(page, 'Test Agency', false);
    await next(page);
    await expect(page.locator('#err-consent')).toHaveText('Please agree so we can contact you.');
    await expect(heading(page, 'Your agency')).toBeVisible();
  });

  test('Back keeps entries; states select all and clear', async ({ page }) => {
    await page.goto('/get-started');
    await fillStep1(page);
    await next(page);
    const states = page.locator('input[name=states]:checked');
    await page.getByRole('button', { name: 'Select all' }).click();
    await expect(states).toHaveCount(51);
    await expect(page.getByText('51 selected')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(states).toHaveCount(0);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByLabel('Agency name')).toHaveValue('Test Agency');
  });

  test('?program and ?vertical preselect', async ({ page }) => {
    await page.goto('/get-started?program=ppc&vertical=medicare');
    await expect(page.getByLabel('Medicare')).toBeChecked();
    await expect(page.getByLabel('Final Expense')).not.toBeChecked();
    // Step 3 is hidden, so check the inputs directly.
    await expect(page.locator('input[name=program][data-slug=ppc]')).toBeChecked();
    await page.goto('/get-started?program=ppa&vertical=final-expense');
    await expect(page.getByLabel('Final Expense')).toBeChecked();
    await expect(page.locator('input[name=program][data-slug=ppa]')).toBeChecked();
  });

  test('ages and buffer appear only for pay per call and clear on switch', async ({ page }) => {
    await page.goto('/get-started');
    await fillToProgram(page);
    const from = page.getByLabel('From', { exact: true });
    const buffer = page.getByLabel('Buffer time', { exact: true });
    await expect(from).toBeHidden();
    await expect(buffer).toBeHidden();
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await expect(from).toBeVisible();
    await from.fill('50');
    await page.getByLabel('To', { exact: true }).fill('70');
    await buffer.selectOption('90 seconds');
    await page.getByRole('radio', { name: /^Pay per application/ }).check({ force: true });
    await expect(from).toBeHidden();
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await expect(from).toHaveValue('');
    await expect(buffer).toHaveValue('');
  });

  test('age validation messages', async ({ page }) => {
    await page.goto('/get-started');
    await fillToProgram(page);
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await page.getByLabel('In the portal').check({ force: true });
    await page.getByLabel('From', { exact: true }).fill('50');
    await send(page);
    await expect(page.locator('#err-ages')).toHaveText('Enter both ages.');
    await page.getByLabel('To', { exact: true }).fill('40');
    await send(page);
    await expect(page.locator('#err-ages')).toHaveText(
      'The second age must be higher than the first.',
    );
  });

  test('rejects the honeypot', async ({ page }) => {
    await page.goto('/get-started');
    await fillToProgram(page);
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await page.getByLabel('In the portal').check({ force: true });
    await page.locator('#company_website').fill('https://spam.example');
    await page.waitForTimeout(3100);
    await send(page);
    await expect(page.getByRole('status')).toContainText('couldn’t accept');
    await expect(page.locator('#apply-form')).toBeVisible();
  });

  test('rejects submissions faster than 3 seconds', async ({ page }) => {
    await page.route('/api/apply', (route) =>
      route.continue({
        postData: JSON.stringify({ ...route.request().postDataJSON(), started: Date.now() }),
      }),
    );
    await page.goto('/get-started');
    await fillToProgram(page);
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await page.getByLabel('In the portal').check({ force: true });
    await send(page);
    await expect(page.getByRole('status')).toContainText('couldn’t accept');
  });

  test('3-step happy path against the mocked SMTP transport', async ({ page }) => {
    await page.goto('/get-started');
    await fillToProgram(page);
    await page.getByRole('radio', { name: /^Pay per call/ }).check({ force: true });
    await page.getByLabel('In the portal').check({ force: true });
    await page.waitForTimeout(3100);
    await send(page);
    await expect(page.getByText('Thanks, Pat Tester — we got it.')).toBeVisible();
    await expect(page.getByText('pat@example.com')).toBeVisible();
    await expect(page.locator('#apply-form')).toHaveCount(0);
  });
});

test('/api/partial fires once after step 1', async ({ page }) => {
  const posts: unknown[] = [];
  await page.route('/api/partial', (route) => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, body: '{}' });
  });
  await page.goto('/get-started?utm_source=google&utm_campaign=fe');
  await fillStep1(page);
  await next(page);
  await expect(heading(page, 'Coverage')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await next(page);
  await expect(heading(page, 'Coverage')).toBeVisible();
  await page.reload();
  await fillStep1(page);
  await next(page);
  await expect(heading(page, 'Coverage')).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({
    agency: 'Test Agency',
    email: 'pat@example.com',
    consent: true,
    utm_source: 'google',
    utm_campaign: 'fe',
    landing: '/get-started',
  });
  expect(posts[0]).not.toHaveProperty('states');
});
