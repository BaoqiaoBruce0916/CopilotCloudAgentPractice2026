import { test, expect } from '@playwright/test';

test.describe('High Contrast Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear display-mode from localStorage before each test to start in dark (default)
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('display-mode'));
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

  test('should switch back to dark mode when Dark button is clicked', async ({ page }) => {
    const hcToggle = page.getByTestId('high-contrast-toggle');
    const darkBtn = page.getByTestId('mode-dark');

    // Enable high contrast
    await hcToggle.click();
    await expect(page.locator('html')).toHaveClass(/high-contrast/);

    // Switch to dark
    await darkBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(hcToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist high contrast preference in localStorage', async ({ page }) => {
    const toggle = page.getByTestId('high-contrast-toggle');

    // Enable high contrast
    await toggle.click();

    // Check localStorage key
    const stored = await page.evaluate(() => localStorage.getItem('display-mode'));
    expect(stored).toBe('high-contrast');
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
