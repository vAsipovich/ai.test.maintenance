import { expect, type Locator, type Page } from '@playwright/test';

export class PlaywrightDevPage {
  readonly page: Page;
  readonly getStartedLink: Locator;
  readonly gettingStartedHeader: Locator;
  readonly pomLink: Locator;
  readonly tocList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedLink = page.getByRole('link', { name: 'Get started' }).first();
    this.gettingStartedHeader = page.getByRole('heading', { name: 'Installation', level: 1 });
    this.pomLink = page.getByRole('link', { name: 'Page Object Model' }).first();
    // Scoped to <article> to avoid matching unrelated lists; class-free selector.
    this.tocList = page.locator('article').locator('ul > li > a');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/Playwright/);
  }

  async getStarted() {
    await this.getStartedLink.first().click();
    await expect(this.gettingStartedHeader).toBeVisible();
  }

  async pageObjectModel() {
    await this.getStarted();
    await this.pomLink.click();
  }
}
