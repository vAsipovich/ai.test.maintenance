import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

// Relative hrefs — resolved against baseURL ('https://playwright.dev') in playwright.config.ts.
const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro' },
  { label: 'API',       href: '/docs/api/class-playwright' },
  { label: 'Community', href: '/community/welcome' },
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
      const link = mainPage.navLink(label as NavLabel);

      await expect(link).toBeVisible();
      await expect.soft(link).toBeEnabled();
      await expect.soft(link).not.toHaveAttribute('aria-disabled', 'true');
      await expect.soft(link).toHaveAttribute('href', href);
    });
  }

  test('a non-existent nav label has no matches', async ({ page }) => {
    const ghostLink = page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Pricing' });

    await expect(ghostLink).toHaveCount(0);
  });

  // Verifies actual browser navigation, not just the DOM href attribute.
  // Catches JS router overrides or event.preventDefault() that would silently
  // pass a static toHaveAttribute('href', …) check.
  test('clicking each nav link navigates to the correct URL', async ({ page }) => {
    const expectedDestinations = [
      { label: 'Docs',      urlPattern: /\/docs\/intro/ },
      { label: 'API',       urlPattern: /\/docs\/api\/class-playwright/ },
      { label: 'Community', urlPattern: /\/community\// },
    ];

    for (const { label, urlPattern } of expectedDestinations) {
      await page.goto('/');
      const link = page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: label });

      await link.click();
      await expect(page).toHaveURL(urlPattern);
    }
  });
});
