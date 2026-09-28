import { test, expect } from '@playwright/test';
import { pages } from './pages';

test('program chooser switches panels by click and arrow keys', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Programs' });
  const ppa = tabs.getByRole('tab', { name: 'Pay per application' });
  const ppc = tabs.getByRole('tab', { name: 'Pay per call' });
  await expect(ppa).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Pay per application' })).toBeVisible();

  await ppc.click();
  await expect(ppc).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Pay per call' })).toContainText(
    'Calls that pass your buffer',
  );
  await expect(page.locator('#panel-ppa')).toBeHidden();

  await ppc.press('ArrowLeft');
  await expect(ppa).toBeFocused();
  await expect(ppa).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-ppa')).toBeVisible();
});

test('portal showcase tabs switch the screenshot', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Portal features' });
  const visibleImg = () => page.locator('[role=tabpanel]:visible img').last();
  await expect(visibleImg()).toHaveAttribute('src', /floor-cards/);
  await tabs.getByRole('tab', { name: 'Applications' }).click();
  await expect(visibleImg()).toHaveAttribute('src', /applications/);
  await tabs.getByRole('tab', { name: 'Applications' }).press('End');
  await expect(tabs.getByRole('tab', { name: 'Statements' })).toBeFocused();
  await expect(visibleImg()).toHaveAttribute('src', /statements/);
});

test('buffer slider readout flips at the marker', async ({ page }) => {
  await page.goto('/pay-per-call');
  const slider = page.getByRole('slider', { name: 'Call length' });
  const readout = page.locator('[data-readout]');
  await expect(readout).toHaveText('Call length: 1:10 — Not billable');
  await expect(slider).toHaveAttribute('aria-valuetext', '1 minute 10 seconds, not billable');

  await slider.fill('90');
  await expect(readout).toHaveText('Call length: 1:30 — Not billable');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(readout).toHaveText('Call length: 1:35 — Billable');
  await slider.fill('125');
  await expect(readout).toHaveText('Call length: 2:05 — Billable');
  await expect(slider).toHaveAttribute('aria-valuetext', '2 minutes 5 seconds, billable');
});

test('FAQ filter hides and shows questions', async ({ page }) => {
  await page.goto('/faq');
  const questions = page.locator('details');
  await expect(questions.filter({ visible: true })).toHaveCount(9);
  await page.getByRole('button', { name: 'Billing' }).click();
  await expect(page.getByRole('button', { name: 'Billing' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(questions.filter({ visible: true })).toHaveCount(2);
  await expect(page.getByText('How do I pay?')).toBeVisible();
  await expect(page.getByText('How do I log in?')).toBeHidden();
  await page.getByRole('button', { name: 'All' }).click();
  await expect(questions.filter({ visible: true })).toHaveCount(9);
});

// The full-frame captures show the owner sidebar and billing amounts; only the four crops may ship.
const CROPS = /\/(floor-cards|applications|customers|statements)\.png/;
for (const [name, path] of pages) {
  test(`${name} only references the four safe screenshot crops`, async ({ page }) => {
    await page.goto(path);
    const html = (await page.content()).replace(/%([0-9a-f]{2})/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
    expect(html).not.toMatch(/agents-floor|buyer-billing|crm-agent|-1440/);
    const urls = await page.evaluate(() =>
      [...document.querySelectorAll('img, source')].flatMap((el) =>
        [el.getAttribute('src'), el.getAttribute('srcset')]
          .filter(Boolean)
          .flatMap((v) => v!.split(',').map((s) => s.trim().split(' ')[0])),
      ),
    );
    for (const url of urls.map(decodeURIComponent)) {
      if (url.includes('/assets/brand/')) continue;
      expect(url).toMatch(CROPS);
    }
  });
}

test('hero call card loops, and shows all steps done with reduced motion', async ({ browser }) => {
  const moving = await browser.newPage();
  await moving.goto('/');
  await expect(moving.locator('[data-step="0"]')).toHaveClass(/current/);
  await expect(moving.locator('[data-step="1"]')).toHaveClass(/current/, { timeout: 4000 });
  await moving.getByRole('button', { name: 'Pause animation' }).click();
  await expect(moving.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await moving.close();

  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const still = await ctx.newPage();
  await still.goto(test.info().project.use.baseURL + '/');
  await expect(still.locator('[data-step].done')).toHaveCount(4);
  await expect(still.locator('[data-journey-toggle]')).toBeHidden();
  await ctx.close();
});
