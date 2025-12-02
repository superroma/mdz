import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import { BACKEND_URL } from "./constants";

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
  originalDocumentContent?: string;
  authToken?: string;
  pendingRedirectPath?: string;
  authTokenToInject?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async ensurePage() {
    if (!sharedBrowser) {
      sharedBrowser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox']
      });
    }
    this.browser = sharedBrowser;

    if (!this.context) {
      this.context = await this.browser.newContext();
      
      if (this.authTokenToInject) {
        const backendUrl = new URL(BACKEND_URL);
        await this.context.addCookies([{
          name: "auth_token",
          value: this.authTokenToInject,
          domain: backendUrl.hostname,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        }]);
      }
    }

    if (!this.page) {
      this.page = await this.context.newPage();
      if (this.authTokenToInject !== undefined) {
        await this.page.addInitScript(
          (token: string | null) => {
            if (token) {
              localStorage.setItem("auth_token", token);
            } else {
              localStorage.removeItem("auth_token");
            }
          },
          this.authTokenToInject ?? null
        );
      }
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

  async setAuthToken(token?: string) {
    this.authTokenToInject = token;
    this.authToken = token;

    if (this.context) {
      const backendUrl = new URL(BACKEND_URL);
      if (token) {
        await this.context.addCookies([{
          name: "auth_token",
          value: token,
          domain: backendUrl.hostname,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        }]);
      } else {
        await this.context.clearCookies({ name: "auth_token" });
      }
    }

    if (this.page) {
      try {
        await this.page.addInitScript(
          (value: string | null) => {
            if (value) {
              localStorage.setItem("auth_token", value);
            } else {
              localStorage.removeItem("auth_token");
            }
          },
          token ?? null
        );
        await this.page.evaluate((value) => {
          if (value) {
            localStorage.setItem("auth_token", value);
          } else {
            localStorage.removeItem("auth_token");
          }
        }, token ?? null);
      } catch {}
    }
  }

  static async closeSharedBrowser() {
    if (sharedBrowser) {
      await sharedBrowser.close();
      sharedBrowser = undefined;
    }
  }
}

setWorldConstructor(AppWorld);

