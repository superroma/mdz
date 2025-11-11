import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  setDefaultTimeout,
  Status,
  type ITestCaseHookParameter
} from "@cucumber/cucumber";
import { ensureServersRunning, shutdownServers } from "./server-manager";
import { AppWorld } from "./world";

setDefaultTimeout(10_000); // Increased for Monaco editor loading time

let testPagesDir: string | undefined;

BeforeAll(async function () {
  if (!process.env.TEST_PAGES_ROOT) {
    const { mkdtempSync, cpSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const { resolve } = await import("node:path");
    
    testPagesDir = mkdtempSync(join(tmpdir(), "e2e-pages-"));
    process.env.TEST_PAGES_ROOT = testPagesDir;
    
    const seedPagesDir = resolve(process.cwd(), "..", "..", "pages");
    if (existsSync(seedPagesDir)) {
      cpSync(seedPagesDir, testPagesDir, { recursive: true });
    }
  }
  await ensureServersRunning();
});

Before(async function (this: AppWorld) {
  // Ensure a fresh browser context for each scenario.
  await this.ensurePage();
});

After(async function (this: AppWorld, { result }: ITestCaseHookParameter) {
  if (result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, "image/png");
  }

  await this.resetBrowser();
});

AfterAll(async function () {
  await shutdownServers();
});

