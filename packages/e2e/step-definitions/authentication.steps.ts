import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

When(
  /^I visit a protected page URL "([^"]*)"$/,
  async function (this: AppWorld, url: string) {
    await ensureServersRunning();
    
    await this.setAuthToken(undefined);
    await this.resetBrowser();
    const page = await this.ensurePage();
    
    await page.goto(`${FRONTEND_URL}${url}`, { waitUntil: "networkidle" });
    this.pendingRedirectPath = url;
  }
);

When(
  "I visit the login page directly",
  async function (this: AppWorld) {
    await ensureServersRunning();
    
    await this.setAuthToken(undefined);
    await this.resetBrowser();
    const page = await this.ensurePage();
    
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });
    this.pendingRedirectPath = undefined;
  }
);

When(
  /^I log in using the test provider as "([^"]*)"$/,
  async function (this: AppWorld, role: string) {
    await ensureServersRunning();
    
    await this.setAuthToken(undefined);
    await this.resetBrowser();
    const page = await this.ensurePage();
    
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle" });
    
    if (this.pendingRedirectPath) {
      await page.evaluate((path) => {
        sessionStorage.setItem("auth_redirect", path);
      }, this.pendingRedirectPath);
      this.pendingRedirectPath = undefined;
    }
    
    const testButton = page.locator('button:has-text("Continue with Test")');
    await testButton.waitFor({ state: "visible", timeout: 10000 });
    await testButton.click();
    
    await page.waitForURL((url) => url.toString().includes('/api/dev-auth/select'), { timeout: 10000 });
    
    const roleLink = page.locator(`a:has-text("${role}")`).first();
    await roleLink.waitFor({ state: "visible", timeout: 10000 });
    await roleLink.click();
    
    await page.waitForURL((url) => {
      const urlStr = url.toString();
      return !urlStr.includes('/auth/callback');
    }, { timeout: 15000 });
    
    try {
      const state = await page.context().storageState();
      const tokenCookie = state.cookies.find(c => c.name === "token");
      if (tokenCookie?.value) {
        this.authToken = tokenCookie.value;
      }
    } catch {}
    
    try {
      const token = await page.evaluate(() => localStorage.getItem("auth_token"));
      if (token) {
        this.authToken = token;
      }
    } catch {}
  }
);

When(
  "I log out",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const userMenu = page.locator('button[aria-label="User menu"]');
    await userMenu.waitFor({ state: "visible", timeout: 10000 });
    await userMenu.click();
    
    const logoutItem = page.locator('[role="menuitem"]:has-text("Logout")');
    await logoutItem.waitFor({ state: "visible", timeout: 10000 });
    await logoutItem.click();
    
    await page.waitForURL((url) => url.toString().includes('/login'), { timeout: 10000 });
  }
);

Then(
  "I should be redirected to the login page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL((url) => url.toString().includes('/login'), { timeout: 10000 });
    expect(page.url()).toContain('/login');
  }
);

Then(
  /^I should be redirected back to "([^"]*)"$/,
  async function (this: AppWorld, expectedPath: string) {
    const page = await this.ensurePage();
    
    const currentPathname = new URL(page.url()).pathname;
    if (currentPathname !== expectedPath) {
      await page.waitForURL((url) => {
        const pathname = new URL(url).pathname;
        return pathname === expectedPath;
      }, { timeout: 15000 });
    }
    
    const pathname = new URL(page.url()).pathname;
    expect(pathname).toBe(expectedPath);
  }
);

Then(
  "I should be redirected to the home page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL((url) => {
      const pathname = new URL(url).pathname;
      return pathname !== '/login' && pathname !== '/auth/callback';
    }, { timeout: 15000 });
    
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe('/login');
    expect(pathname).not.toBe('/auth/callback');
  }
);
