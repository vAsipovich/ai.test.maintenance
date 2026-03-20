import { test, expect } from '@playwright/test';
import { PlaywrightDevPage } from '../pages/playwright-dev-page';

test.describe('playwright.dev — documentation pages', () => {
  let playwrightDev: PlaywrightDevPage;

  test.beforeEach(async ({ page }) => {
    playwrightDev = new PlaywrightDevPage(page);
    await playwrightDev.goto();
  });

  test('getting started page contains a table of contents', async () => {
    await playwrightDev.getStarted();
    // Assert count rather than exact strings to avoid breaking on minor docs wording changes.
    await expect(playwrightDev.tocList).toHaveCount(9);
  });

  test('Page Object Model article is reachable and contains expected content', async ({ page }) => {
    await playwrightDev.pageObjectModel();
    // Scoped to the article element to avoid false matches in nav or sidebars.
    await expect(page.locator('article')).toContainText(
      'Page Object Model is a common pattern'
    );
  });
});
