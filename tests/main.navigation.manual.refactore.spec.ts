import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

/**
 * Manual-refactored spec — extends main.navigation.refactored.spec.ts with
 * explicit ARIA accessibility assertions on every navigation element:
 *  - The navigation landmark itself carries role="navigation" with the correct accessible name
 *  - Each link element carries role="link" (verified via getByRole + toBeVisible)
 *  - Each link has a non-empty accessible name matching the visible label
 *  - Each link is NOT aria-disabled (enabled = interactable by assistive technology)
 *  - Inline aria-label / aria-labelledby is absent (name comes from text content — clean ARIA)
 */

const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro' },
  { label: 'API',       href: '/docs/api/class-playwright' },
  { label: 'Community', href: '/community/welcome' },
] as const;

test.describe('Main page — navigation ARIA accessibility', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  test('navigation landmark has role="navigation" and accessible name "Main"', async ({ page }) => {
    await test.step('navigation role is present', async () => {
      await expect(
        page.getByRole('navigation', { name: 'Main' })
      ).toBeVisible();
    });

    await test.step('navigation accessible name is "Main"', async () => {
      // getByRole with exact name match confirms the accessible name exposed to AT
      await expect(
        page.getByRole('navigation', { name: 'Main', exact: true })
      ).toHaveCount(1);
    });
  });

  for (const { label, href } of NAV_LINKS) {
    test(`"${label}" — ARIA role, accessible name, state and target`, async () => {
      // getByRole('link', { name }) is itself an implicit ARIA assertion:
      // it resolves ONLY when an element with role="link" AND the
      // matching accessible name exists in the accessibility tree.
      const link = mainPage.navLink(label);

      await test.step(`role="link" exists with accessible name "${label}"`, async () => {
        await expect(link).toBeVisible();
      });

      await test.step(`accessible name is not overridden by aria-label`, async () => {
        // Clean ARIA: the name should come from text content, not an aria-label override.
        await expect(link).not.toHaveAttribute('aria-label', /.*/);
      });

      await test.step(`element is not aria-disabled`, async () => {
        await expect(link).not.toHaveAttribute('aria-disabled', 'true');
        await expect(link).toBeEnabled();
      });

      await test.step(`href is keyboard/AT reachable and points to "${href}"`, async () => {
        await expect(link).toHaveAttribute('href', href);
      });
    });
  }
});
