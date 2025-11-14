import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";

export type HttpResponse = {
  status: number;
  body: unknown;
};

// Shared browser instance across all scenarios for better performance
let sharedBrowser: Browser | undefined;

export class AppWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  lastResponse?: HttpResponse;
  checkboxStateBefore?: boolean;
  clickedItemText?: string;
  checkboxCountInEditMode?: number;
  scrollPositionBefore?: number;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async ensurePage() {
    // Reuse shared browser instance
    if (!sharedBrowser) {
      sharedBrowser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox']
      });
    }
    this.browser = sharedBrowser;

    // Create new context for each scenario (isolation)
    if (!this.context) {
      this.context = await this.browser.newContext();
    }

    if (!this.page) {
      this.page = await this.context.newPage();
    }

    return this.page;
  }

  async resetBrowser() {
    // Only close page and context, keep browser alive
    if (this.page) {
      await this.page.close();
      this.page = undefined;
    }
    if (this.context) {
      await this.context.close();
      this.context = undefined;
    }
    // Don't close shared browser between scenarios
  }

  static async closeSharedBrowser() {
    if (sharedBrowser) {
      await sharedBrowser.close();
      sharedBrowser = undefined;
    }
  }
}

setWorldConstructor(AppWorld);

