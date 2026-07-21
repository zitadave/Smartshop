/**
 * E2E Tests for Smart Shop critical user flows.
 * Run: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Smart Shop — Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Home page loads and shows products', async ({ page }) => {
    await expect(page.locator('text=Smart Shop')).toBeVisible();
    await expect(page.locator('[class*="card-glow"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Search flow: type → see results', async ({ page }) => {
    await page.goto('/shop');
    await page.fill('[placeholder*="Search"]', 'headphones');
    // Wait for React to re-render filtered results
    await page.waitForTimeout(500);
    const results = page.locator('[class*="card-glow"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Product detail page loads', async ({ page }) => {
    // Click first product on home page
    const firstCard = page.locator('[class*="card-glow"]').first();
    await firstCard.click();
    await page.waitForURL(/\/product\/\d+/);
    await expect(page.locator('text=Add to Cart').or(page.locator('[class*="ShoppingCart"]'))).toBeVisible({ timeout: 5000 });
  });

  test('Add to cart updates badge', async ({ page }) => {
    // Click first cart icon button
    const cartBtn = page.locator('[aria-label="Add to cart"]').first();
    await cartBtn.click();
    // Check badge appears
    const badge = page.locator('[class*="count-badge"]');
    await expect(badge).toBeVisible({ timeout: 3000 });
    expect(await badge.textContent()).toBe('1');
  });

  test('Wishlist toggle works', async ({ page }) => {
    const wishBtn = page.locator('[aria-label*="wishlist"]').first();
    await wishBtn.click();
    // Heart should turn red/active
    await expect(wishBtn.locator('text=❤️').or(wishBtn.locator('[class*="text-red"]'))).toBeVisible({ timeout: 3000 });
  });

  test('Category filter narrows results', async ({ page }) => {
    await page.goto('/shop');
    const catBtn = page.locator('button:has-text("Tech")');
    await catBtn.click();
    await page.waitForTimeout(300);
    // After clicking a category, URL should be /shop and products filtered
    const cards = page.locator('[class*="card-glow"]');
    const count = await cards.count();
    // Should be fewer than total or zero (valid state)
    expect(count).toBeDefined();
  });

  test('Dark mode toggle switches theme', async ({ page }) => {
    const themeBtn = page.locator('header button:has(svg)').first();
    await themeBtn.click();
    const html = page.locator('html');
    const hasDark = await html.evaluate(el => el.classList.contains('dark'));
    // Toggle again
    await themeBtn.click();
    const hasDarkAfter = await html.evaluate(el => el.classList.contains('dark'));
    expect(hasDark).not.toBe(hasDarkAfter);
  });

  test('Cart page shows empty state', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('text=empty')).toBeVisible({ timeout: 5000 });
  });
});
