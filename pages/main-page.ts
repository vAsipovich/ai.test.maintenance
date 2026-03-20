import { type Locator, type Page } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly nav: Locator;
  readonly docsLink: Locator;
  readonly apiLink: Locator;
  readonly communityLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.getByRole('navigation', { name: 'Main' });
    this.docsLink = page.locator("css=#docs");
    this.apiLink = this.nav.getByRole('link', { name: 'API' });
    this.communityLink = this.nav.getByRole('link', { name: 'Community' });
  }

  async goto() {
    await this.page.goto('/');
  }
}
