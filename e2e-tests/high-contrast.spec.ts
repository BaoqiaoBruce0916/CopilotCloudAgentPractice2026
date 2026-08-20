import { test, expect } from '@playwright/test';

test.describe('High Contrast Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('high-contrast'));
    await page.reload();
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
  });

  test('should display the high contrast toggle button', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('High Contrast');
  });

  test('should enable high contrast mode when toggled', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');

    // Initially not in high contrast mode
    await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    // Click the toggle
    await toggle.click();

    // html element should now have high-contrast class
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('should disable high contrast mode when toggled again', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');

    // Enable high contrast
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/high-contrast/);

    // Disable high contrast
    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should persist high contrast preference in localStorage', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');

    // Enable high contrast
    await toggle.click();

    // Check localStorage
    const stored = await page.evaluate(() => localStorage.getItem('high-contrast'));
    expect(stored).toBe('true');
  });

  test('should restore high contrast mode from localStorage on reload', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');

    // Enable high contrast and reload
    await toggle.click();
    await page.reload();
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

    // Should still be in high contrast mode
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
    await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  test('should be keyboard accessible', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();

    // Activate with Enter key
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
  });
});
