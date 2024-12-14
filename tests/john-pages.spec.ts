import { test } from '@playwright/test';

test.use({
  storageState: 'john-auth.json',
});

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByPlaceholder('E-mail').click();
  await page.getByPlaceholder('E-mail').fill('john@foo.com');
  await page.getByPlaceholder('E-mail').press('Tab');
  await page.getByPlaceholder('Password').fill('changeme');
  await page.getByRole('button', { name: 'Login ' }).click();
  await page.getByRole('link', { name: 'Manoa Menu' }).click();
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Campus Cravings' }).click();
  await page.getByRole('link', { name: 'Find a Location' }).click();
});
