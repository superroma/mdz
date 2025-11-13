import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";

export type HttpResponse = {
  status: number;
  body: unknown;
};

export class AppWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  lastResponse?: HttpResponse;
  checkboxStateBefore?: boolean;
  clickedItemText?: string;
  checkboxCountInEditMode?: number;
  scrollPositionBefore?: number;
  originalDocumentContent?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async ensurePage() {
    if (!this.browser) {
      this.browser = await chromium.launch();
    }

    if (!this.context) {
      this.context = await this.browser.newContext();
    }

    if (!this.page) {
      this.page = await this.context.newPage();
    }

    return this.page;
  }

  async resetBrowser() {
    if (this.page) {
      await this.page.close();
      this.page = undefined;
    }
    if (this.context) {
      await this.context.close();
      this.context = undefined;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}

setWorldConstructor(AppWorld);

