import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

/**
 * Refactored spec — addresses all issues from docs/legacy-test-analysis.md:
 *  - No fixed waits (waitForTimeout removed; goto() now guards with toHaveTitle)
 *  - Consistent role-based locators via navLink(), all scoped inside nav "Main"
 *  - Three isolated tests (one per link) — a single broken selector cannot mask siblings
 *  - Each test asserts: visibility, interactivity (enabled), and correct href target
 *  - test.step() labels provide granular reporting in the HTML report
 *  - Title uses "links" not "buttons" to match ARIA role semantics
 */

const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro' },
  { label: 'API',       href: '/docs/api/class-playwright' },
  { label: 'Community', href: '/community/welcome' },
] as const;

test.describe('Main page — navigation links', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  for (const { label, href } of NAV_LINKS) {
    test(`"${label}" link is visible, enabled and navigates to the correct destination`, async () => {
      const link = mainPage.navLink(label);

      await test.step(`"${label}" link is visible in the main navigation`, async () => {
        await expect(link).toBeVisible();
      });

      await test.step(`"${label}" link is enabled and interactable`, async () => {
        await expect(link).toBeEnabled();
      });

      await test.step(`"${label}" link href points to "${href}"`, async () => {
        await expect(link).toHaveAttribute('href', href);
      });
    });
  }
});
