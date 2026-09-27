import { test } from '@playwright/test';
import { pages } from './pages';

// Run with `npm run screenshots`; writes docs/screenshots/<page>-<width>.png. Excluded from `npm test`.

for (const width of [390, 1440]) {
  for (const [name, path] of pages) {
    test(`@screenshot ${name} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(async () => {
        document.querySelectorAll<HTMLImageElement>('img[loading=lazy]').forEach((i) => {
          i.loading = 'eager';
        });
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      await page.screenshot({ path: `docs/screenshots/${name}-${width}.png`, fullPage: true });
    });
  }
}
