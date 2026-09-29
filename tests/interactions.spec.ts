import { test, expect } from '@playwright/test';
import { pages } from './pages';

const QUAL = {
  'Final Expense': [
    'Interested in final expense',
    'Not in a nursing home or assisted living',
    'Makes their own financial decisions',
    'Age 40 to 85',
    'Agrees to speak with a licensed agent',
  ],
  Medicare: [
    'Interested in Medicare',
    'Has Medicare Parts A and B',
    'Not in a nursing home or assisted living',
    'Makes their own financial decisions',
    'Agrees to speak with a licensed agent',
  ],
};

test('qualification tabs switch content and show the exact 5 items per vertical', async ({
  page,
}) => {
  await page.goto('/pay-per-call');
  const tabs = page.getByRole('tablist', { name: 'Verticals' });
  const items = () => page.locator('[role=tabpanel]:visible .qual-title');
  await expect(tabs.getByRole('tab', { name: 'Final Expense' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(items()).toHaveText(QUAL['Final Expense']);
  await tabs.getByRole('tab', { name: 'Medicare' }).click();
  await expect(items()).toHaveText(QUAL.Medicare);
  await expect(page.locator('#qpanel-final-expense')).toBeHidden();
  await tabs.getByRole('tab', { name: 'Medicare' }).press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Final Expense' })).toBeFocused();
  await expect(items()).toHaveText(QUAL['Final Expense']);
});

for (const path of ['/pay-per-application', '/pay-per-call', '/get-started', '/faq']) {
  test(`prices render on ${path}`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    if (path !== '/pay-per-call') expect(text).toContain('$199');
    if (path !== '/pay-per-application') expect(text).toContain('$25');
  });
}

test('pay per call filter section shows the three filters', async ({ page }) => {
  await page.goto('/pay-per-call');
  await expect(page.getByRole('heading', { level: 2, name: /From \$25 a call/ })).toBeVisible();
  await expect(page.locator('[data-ppc-filters] h3')).toHaveText(['States', 'Ages', 'Buffer time']);
  await expect(
    page.getByRole('link', { name: 'Get your pay per call rate' }).first(),
  ).toHaveAttribute('href', '/get-started?program=ppc');
});

test('cta_click fires with the right location', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const w = window as unknown as { calls: unknown[][]; gtag: (...a: unknown[]) => void };
    w.calls = [];
    w.gtag = (...a) => w.calls.push(a);
  });
  await page.goto('/');
  // Record the click without following the link.
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault()));
  for (const loc of ['hero', 'header', 'final_expense', 'cta_band', 'footer'])
    await page.locator(`a[data-cta=${loc}]:visible`).first().click();
  const calls = await page.evaluate(() => (window as unknown as { calls: unknown[][] }).calls);
  const locations = calls
    .filter(([, name]) => name === 'cta_click')
    .map(([, , p]) => (p as { location: string }).location);
  expect(locations).toEqual(['hero', 'header', 'final_expense', 'cta_band', 'footer']);
});

test('every /get-started button carries a data-cta location', async ({ page }) => {
  for (const path of ['/', '/pay-per-application', '/pay-per-call', '/platform', '/faq']) {
    await page.goto(path);
    const missing = await page
      .locator('a.btn[href^="/get-started"]:not([data-cta])')
      .evaluateAll((els) => els.map((e) => e.outerHTML.slice(0, 100)));
    expect(missing, path).toEqual([]);
  }
});

test('portal showcase tabs switch the screenshot', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Portal features' });
  const visibleImg = () => page.locator('[role=tabpanel]:visible img').last();
  await expect(visibleImg()).toHaveAttribute('src', /agents-floor/);
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
  const status = page.locator('[data-status]');
  await expect(readout).toHaveText('Call length: 1:10');
  await expect(status).toHaveText('Not billable');
  await expect(slider).toHaveAttribute('aria-valuetext', '1 minute 10 seconds, not billable');

  await slider.fill('90');
  await expect(readout).toHaveText('Call length: 1:30');
  await expect(status).toHaveText('Not billable');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(readout).toHaveText('Call length: 1:35');
  await expect(status).toHaveText('Billable');
  await slider.fill('125');
  await expect(readout).toHaveText('Call length: 2:05');
  await expect(slider).toHaveAttribute('aria-valuetext', '2 minutes 5 seconds, billable');
});

test('FAQ filter hides and shows questions', async ({ page }) => {
  await page.goto('/faq');
  const questions = page.locator('details');
  await expect(questions.filter({ visible: true })).toHaveCount(20);
  await page.getByRole('button', { name: 'Billing' }).click();
  await expect(page.getByRole('button', { name: 'Billing' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(questions.filter({ visible: true })).toHaveCount(3);
  await expect(page.getByText('How do I pay?')).toBeVisible();
  await expect(page.getByText('How do I log in?')).toBeHidden();
  await page.getByRole('button', { name: 'Pricing' }).click();
  await expect(questions.filter({ visible: true })).toHaveCount(4);
  await page.getByRole('button', { name: 'All' }).click();
  await expect(questions.filter({ visible: true })).toHaveCount(20);
});

// The full-frame captures show the owner sidebar and billing amounts; only the crops may ship.
const CROPS = /\/(agents-floor|floor-cards|applications|customers|statements)\.png/;
for (const [name, path] of pages) {
  test(`${name} only references the safe screenshot crops`, async ({ page }) => {
    await page.goto(path);
    const html = (await page.content()).replace(/%([0-9a-f]{2})/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
    expect(html).not.toMatch(/agents-floor-(1440|390)|buyer-billing|crm-agent|-1440/);
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

test('hero H1 punctuation sits against its word', async ({ page }) => {
  await page.goto('/');
  const runs = await page.locator('.hero h1').evaluate((h1) => {
    const texts: string[] = [];
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) texts.push(walker.currentNode.textContent!);
    return texts;
  });
  const text = runs.join('');
  // No space or &nbsp; before the punctuation, and each mark in the same text node as its word.
  expect(text).not.toMatch(/\s[,.]/); // JS \s includes U+00A0 (&nbsp;)
  expect(runs.some((t) => t.includes('calls.'))).toBe(true);
  // The tight-bearing comma/period font is what renders them.
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].some((f) => f.family.includes('Jakarta Punct') && f.status === 'loaded'),
  );
  expect(loaded).toBe(true);
});

test('legal pages show the company contact block', async ({ page }) => {
  for (const path of ['/terms', '/privacy', '/tcpa-compliance']) {
    await page.goto(path);
    const main = page.locator('main');
    await expect(main).toContainText('Life Leads Plus');
    await expect(main).toContainText('Denver, CO 80202');
    await expect(main.locator('a[href="tel:+13035550100"]').first()).toBeVisible();
  }
});

test('footer links to all three legal pages', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer').getByRole('navigation', { name: 'Legal' });
  for (const [name, href] of [
    ['Terms of Service', '/terms'],
    ['Privacy Policy', '/privacy'],
    ['TCPA & Compliance', '/tcpa-compliance'],
  ]) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
});
