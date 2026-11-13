import { expect, test } from '@playwright/test';

const e2eEnabled = process.env.E2E_ENABLED === 'true';

test.describe('ACME critical flows', () => {
  test.skip(!e2eEnabled, 'Set E2E_ENABLED=true with API+DB seeded to run Playwright flows');

  test('login, open employees, and open reports', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await page.getByLabel(/email/i).fill('hr.manager@acme.example');
    await page.getByLabel(/password/i).fill('ChangeMeNow!123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: /hr salary intelligence/i })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('link', { name: /employees/i }).click();
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
    await expect(page.getByText(/server-side search/i)).toBeVisible();

    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page.getByRole('heading', { name: /salary reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
  });
});
