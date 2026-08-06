import { test, expect } from '@playwright/test';

// Skipped by default: requires a running dev server and installed browsers.
// Enable in CI once the e2e environment is provisioned.
test.skip('home page renders its heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
