import { expect, type Locator, type Page } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly nav: Locator;
  readonly docsLink: Locator;
  readonly apiLink: Locator;
  readonly communityLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.getByRole('navigation', { name: 'Main' });
    this.docsLink = this.nav.getByRole('link', { name: 'Docs' });
    this.apiLink = this.nav.getByRole('link', { name: 'API' });
    this.communityLink = this.nav.getByRole('link', { name: 'Community' });
  }

  /** Returns a nav link locator by its visible label (e.g. 'Docs', 'API', 'Community'). */
  navLink(name: string): Locator {
    return this.nav.getByRole('link', { name });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/Playwright/);
  }
}
