import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

// Single source of truth for nav link data.
// urlPattern is derived from href so a route rename requires only one edit here.
const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro',                urlPattern: /\/docs\/intro$/ },
  { label: 'API',       href: '/docs/api/class-playwright', urlPattern: /\/docs\/api\/class-playwright$/ },
  { label: 'Community', href: '/community/welcome',         urlPattern: /\/community\/welcome$/ },
] as const;

type NavLabel = typeof NAV_LINKS[number]['label'];

test.describe('Main page — navigation links', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  for (const { label, href } of NAV_LINKS) {
    test(`"${label}" nav link is visible, enabled and points to "${href}"`, async () => {
      const link = mainPage.navLink(label);

      await expect(link).toBeVisible();
      await expect.soft(link).toBeEnabled();
      await expect.soft(link).not.toHaveAttribute('aria-disabled', 'true');
      await expect(link).toHaveAttribute('href', href);  // hard assert: wrong href = immediate failure
    });
  }

  // Guards against a real nav link being silently removed from the DOM.
  test('navigation contains exactly the expected number of links', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main' });
    // NAV_LINKS.length (3) + extra nav links (logo + GitHub + Discord = 3) = 6 total
    await expect(nav.getByRole('link')).toHaveCount(NAV_LINKS.length + 3);
  });

  // Verifies actual browser navigation, not just the DOM href attribute.
  // Catches JS router overrides or event.preventDefault() bypasses.
  // Reuses NAV_LINKS so a route rename requires only one edit.
  test('clicking each nav link navigates to the correct URL', async ({ page }) => {
    for (const { label, urlPattern } of NAV_LINKS) {
      await page.goto('/');
      const link = page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: label });

      await link.click();
      await expect(page).toHaveURL(urlPattern);
    }
  });
});

// ---------------------------------------------------------------------------
// ARIA accessibility — merged from main.navigation.manual.refactore.spec.ts
// ---------------------------------------------------------------------------
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
