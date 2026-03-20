import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

test('The main page should display navigation buttons: Docs, API, Community', async ({ page }) => {
  const mainPage = new MainPage(page);
  await mainPage.goto();
  await page.waitForTimeout(2000);
  await expect(mainPage.docsLink).toBeVisible();
  await expect(mainPage.apiLink).toBeVisible();
  await expect(mainPage.communityLink).toBeVisible();
});
