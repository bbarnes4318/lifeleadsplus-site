import { test, expect } from '@playwright/test';

const campaignPath = '/medicare-tv-calls';
const expectedQuery = 'program=ppc&vertical=medicare&buffer=120%20seconds';

test('Medicare TV page displays the dedicated offer and keeps its CTA attribution', async ({
  page,
}) => {
  await page.goto(campaignPath);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Start answering Medicare calls.',
  );
  await expect(page.locator('.med-proof-value').first()).toHaveText('$35');
  await expect(page.locator('.med-proof-value').nth(1)).toContainText('120');
  await expect(page.locator('.med-proof-value').nth(2)).toHaveText('1 in 3');
  const links = page.locator('a[href^="/get-started"][data-cta^="medicare_"]');
  expect(await links.count()).toBeGreaterThanOrEqual(4);
  for (const href of await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
    expect(href).toContain(expectedQuery);
  }
});

test('Medicare cost model responds to input without changing the $35 price', async ({ page }) => {
  await page.goto(campaignPath);
  await expect(page.locator('#med-cost-output')).toHaveText('$1,050');
  await expect(page.locator('#med-apps-output')).toHaveText('~10');
  await expect(page.locator('#med-cpa-output')).toHaveText('~$105');

  await page.locator('#med-calls').evaluate((el: HTMLInputElement) => {
    el.value = '50';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#med-cost-output')).toHaveText('$1,750');
  await expect(page.locator('#med-apps-output')).toHaveText('~17');
});

test('Medicare campaign application preserves program, vertical and 120-second buffer', async ({
  page,
}) => {
  await page.goto('/get-started?' + expectedQuery);
  await expect(page.locator('input[name="verticals"][data-slug="medicare"]')).toBeChecked();
  await expect(page.locator('input[name="program"][data-slug="ppc"]')).toBeChecked();
  await expect(page.locator('select[name="buffer"]')).toHaveValue('120 seconds');
});

test('mobile bar points to the same Medicare application', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(campaignPath);
  await expect(page.locator('[data-mobile-cta] a')).toHaveAttribute(
    'href',
    new RegExp(expectedQuery),
  );
  await expect(page.locator('[data-mobile-cta] a')).toContainText('Medicare');
});
