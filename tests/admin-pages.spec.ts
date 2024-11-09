import { test, expect } from '@playwright/test';

test.use({
  storageState: 'admin-auth.json',
});

test('Admin Pages', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('link', { name: 'Next.js Application Template' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add Stuff' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'List Stuff' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'admin@foo.com' })).toBeVisible();
  await page.getByRole('link', { name: 'Add Stuff' }).click();
  await expect(page.getByRole('heading', { name: 'Add Stuff' })).toBeVisible();
  await page.getByRole('link', { name: 'List Stuff' }).click();
  await expect(page.getByRole('heading', { name: 'Stuff' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: 'List Stuff Admin' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'List Users Admin' })).toBeVisible();
});
