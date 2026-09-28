import { test, expect, type Page } from '@playwright/test';
import { pages } from './pages';

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  for (const [name, path] of pages) {
    test(`${name} renders at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await noHorizontalScroll(page)).toBe(true);
      // The 404 page's own document response is a 404, which Chromium logs as a console error.
      expect(errors.filter((e) => !(name === '404' && e.includes('404')))).toEqual([]);
    });
  }
}

test('header nav links work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('link', { name: 'The Portal' }).click();
  await expect(page).toHaveURL(/\/platform$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('One portal');
  await expect(page.getByRole('link', { name: 'Client login' }).first()).toHaveAttribute(
    'href',
    'https://portal.example.com/login',
  );
});

test('mobile menu opens, traps focus, closes on Esc, navigates', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await dialog.getByRole('link', { name: 'FAQ' }).click();
  await expect(page).toHaveURL(/\/faq$/);
});

test('/login redirects to the portal', async ({ request }) => {
  const res = await request.get('/login', { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()['location']).toBe('https://portal.example.com/login');
});
