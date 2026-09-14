import { test, expect } from '@playwright/test';

const ccMenu = (dish: string) => [{ name: 'Monday', plateLunch: [dish], grabAndGo: [], specialMessage: '' }];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', route => route.fulfill({ json: {} }));
  await page.route('**/api/*-hours', route => route.fulfill({ json: { hours: null } }));
});

test('recovers from an outage through the visible retry button', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let recover = false;
  await page.route('**/api/cc-menu?*', route => route.fulfill(recover
    ? { json: ccMenu('Recovered chicken') } : { status: 503, json: { error: 'temporary outage' } }));
  await page.goto('http://127.0.0.1:3000');
  await expect(page.locator('.MuiAlert-root')).toContainText('We couldn’t load this menu');
  await expect(page.getByRole('tab', { name: 'Gateway', exact: true })).toBeVisible();
  recover = true;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Recovered chicken', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.locator('.MuiAlert-root')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('an old language response cannot overwrite the latest selection', async ({ page }) => {
  let releaseJapanese!: () => void;
  const japaneseGate = new Promise<void>(resolve => { releaseJapanese = resolve; });
  let japaneseStarted!: () => void;
  const started = new Promise<void>(resolve => { japaneseStarted = resolve; });
  await page.route('**/api/cc-menu?*', async route => {
    const language = new URL(route.request().url()).searchParams.get('language');
    if (language === 'Japanese') {
      japaneseStarted();
      await japaneseGate;
      await route.fulfill({ json: ccMenu('Old Japanese response') }).catch(() => {});
    } else {
      await route.fulfill({ json: ccMenu(language === 'Korean' ? 'Latest Korean response' : 'English chicken') });
    }
  });
  await page.goto('http://127.0.0.1:3000');
  await expect(page.getByText('English chicken', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('tab', { name: '日本語', exact: true }).click();
  await started;
  await page.getByRole('tab', { name: '한국어', exact: true }).click();
  await expect(page.getByText('Latest Korean response', { exact: true }).filter({ visible: true })).toBeVisible();
  releaseJapanese();
  await expect(page.getByText('Old Japanese response', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: '한국어', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('shows a partial-week notice and keeps the usable menu on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/cc-menu?*', route => route.fulfill({ json: ccMenu('Chicken') }));
  await page.route('**/api/sdx-menu?*', route => route.fulfill({ json: [
    { date: '2026-09-07', meals: [], status: 'unavailable' },
    { date: '2026-09-08', meals: [{ name: 'Lunch', groups: [
      { name: 'Grill', items: [{ formalName: 'Available tofu', isVegan: true }] },
    ] }] },
  ] }));
  await page.goto('http://127.0.0.1:3000');
  await page.getByRole('tab', { name: 'Gateway', exact: true }).click();
  await expect(page.locator('.MuiAlert-root')).toContainText('Some days couldn’t be loaded');
  await expect(page.getByText('Available tofu', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/menu-recovery-mobile.png', fullPage: true, animations: 'disabled' });
});

test('explains the English fallback when translations are unavailable', async ({ page }) => {
  await page.route('**/api/cc-menu?*', route => route.fulfill({
    json: ccMenu('English fallback chicken'), headers: { 'X-Menu-Language': 'English' },
  }));
  await page.goto('http://127.0.0.1:3000');
  await expect(page.locator('.MuiAlert-root')).toContainText('Some translations are unavailable');
  await expect(page.getByText('English fallback chicken', { exact: true }).filter({ visible: true })).toBeVisible();
});
