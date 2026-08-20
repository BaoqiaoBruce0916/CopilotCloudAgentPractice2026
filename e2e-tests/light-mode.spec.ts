import { test, expect } from '@playwright/test';

test.describe('Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh in dark mode (default)
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('display-mode'));
    await page.reload();
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
  });

  test('should display the Light button in the header', async ({ page }) => {
    const lightBtn = page.getByTestId('mode-light');
    await expect(lightBtn).toBeVisible();
    await expect(lightBtn).toHaveText('Light');
  });

  test('should display the Dark button in the header', async ({ page }) => {
    const darkBtn = page.getByTestId('mode-dark');
    await expect(darkBtn).toBeVisible();
    await expect(darkBtn).toHaveText('Dark');
  });

  test('should default to dark mode', async ({ page }) => {
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('mode-dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('mode-light')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('should enable light mode when Light button is clicked', async ({ page }) => {
    const lightBtn = page.getByTestId('mode-light');

    await lightBtn.click();

    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('mode-dark')).toHaveAttribute('aria-pressed', 'false');
  });

  test('should switch from light back to dark mode', async ({ page }) => {
    const lightBtn = page.getByTestId('mode-light');
    const darkBtn = page.getByTestId('mode-dark');

    await lightBtn.click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await darkBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/light/);
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('should persist light mode preference in localStorage', async ({ page }) => {
    await page.getByTestId('mode-light').click();

    const stored = await page.evaluate(() => localStorage.getItem('display-mode'));
    expect(stored).toBe('light');
  });

  test('should restore light mode from localStorage on reload', async ({ page }) => {
    await page.getByTestId('mode-light').click();
    await page.reload();
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.getByTestId('mode-light')).toHaveAttribute('aria-pressed', 'true');
  });

  test('should be keyboard accessible', async ({ page }) => {
    const lightBtn = page.getByTestId('mode-light');
    await lightBtn.focus();
    await expect(lightBtn).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/light/);
  });

  test('only one mode should be active at a time', async ({ page }) => {
    // Switch to light
    await page.getByTestId('mode-light').click();
    await expect(page.getByTestId('mode-dark')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('mode-light')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'false');

    // Switch to high contrast
    await page.getByTestId('high-contrast-toggle').click();
    await expect(page.getByTestId('mode-dark')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('mode-light')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
  });
});
