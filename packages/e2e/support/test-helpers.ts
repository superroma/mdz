import { Page } from "@playwright/test";
import { FRONTEND_URL } from "./constants";
import { ensureServersRunning } from "./server-manager";
import { AppWorld } from "./world";

/**
 * Sets up a page by ensuring servers are running, creating the page, and navigating to the specified path
 */
export async function setupPage(world: AppWorld, path = ""): Promise<Page> {
  await ensureServersRunning();
  const page = await world.ensurePage();
  const url = path ? `${FRONTEND_URL}${path}` : FRONTEND_URL;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("navigation", { name: "Page tree" }).waitFor({ timeout: 10000 });
  await page.waitForFunction(() => {
    return document.querySelectorAll('[aria-label^="Navigate to"]').length > 0;
  }, { timeout: 10000 });
  return page;
}

/**
 * Waits for the page to load by checking for the title input field
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
}

/**
 * Waits for network activity to settle (with timeout fallback)
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
}

/**
 * Navigates to a page by clicking on its sidebar navigation button
 */
export async function navigateToPageByTitle(page: Page, pageTitle: string): Promise<void> {
  const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pageButton = page.getByRole("button", { 
    name: new RegExp(`Navigate to ${escapedTitle}`, "i") 
  });
  await pageButton.waitFor({ state: "visible", timeout: 10000 });
  await pageButton.click();
  await waitForPageLoad(page);
}

/**
 * Switches between edit and preview modes
 */
export async function switchToMode(page: Page, mode: 'edit' | 'preview'): Promise<void> {
  if (mode === 'edit') {
    const editButton = page.getByRole("button", { name: "Edit" });
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForSelector('[aria-label="Page content"]', { timeout: 5000 });
    }
  } else {
    const editButton = page.getByRole("button", { name: "Edit" });
    if (await editButton.isVisible()) {
      return; // Already in preview mode
    }
    const previewButton = page.getByRole("button", { name: "Preview" });
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
      await page.waitForSelector('.prose', { timeout: 5000 });
    }
  }
}

/**
 * Verifies that navigation occurred to a page matching the expected pattern
 */
export async function verifyNavigation(page: Page, expectedPattern?: RegExp): Promise<void> {
  await page.waitForURL((url) => {
    const path = new URL(url).pathname;
    if (expectedPattern) {
      return expectedPattern.test(path);
    }
    return path !== "/" && path.length > 1;
  }, { timeout: 5000 });
}

/**
 * Fills the title field and submits via Enter key or blur
 */
export async function fillTitleAndSubmit(page: Page, title: string, submitKey: 'Enter' | 'blur'): Promise<void> {
  const titleField = page.getByRole("textbox", { name: "Page title" });
  await titleField.fill(title);
  if (submitKey === 'Enter') {
    await titleField.press("Enter");
  } else {
    await titleField.blur();
  }
  await waitForNetworkIdle(page);
}

