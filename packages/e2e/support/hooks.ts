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

setDefaultTimeout(5_000);

let testPagesDir: string | undefined;

BeforeAll({ timeout: 90000 }, async function () {
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

Before(async function (this: AppWorld, scenario) {
  // Ensure a fresh browser context for each scenario.
  await this.ensurePage();

  const { readFileSync, writeFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { resolve } = await import("node:path");

  if (!testPagesDir) return;

  // Reset Getting Started.md for checkbox-related tests to ensure clean state
  if (scenario.pickle.name.includes('checkbox') || scenario.pickle.name.includes('Toggle')) {
    const originalFile = resolve(process.cwd(), "..", "..", "pages", "Welcome", "Getting Started.md");
    const testFile = join(testPagesDir, "Welcome", "Getting Started.md");

    try {
      const originalContent = readFileSync(originalFile, 'utf8');
      writeFileSync(testFile, originalContent, 'utf8');
    } catch (error) {
      console.warn('Could not reset Getting Started.md:', error);
    }
  }

  // Reset Write Tests.md for front-matter related tests
  if (scenario.pickle.name.includes('front-matter')) {
    const originalFile = resolve(process.cwd(), "..", "..", "pages", "Welcome", "Tasks", "Write Tests.md");
    const testFile = join(testPagesDir, "Welcome", "Tasks", "Write Tests.md");

    try {
      if (existsSync(originalFile)) {
        const originalContent = readFileSync(originalFile, 'utf8');
        writeFileSync(testFile, originalContent, 'utf8');
      }
    } catch (error) {
      console.warn('Could not reset Write Tests.md:', error);
    }
  }
});

After(async function (this: AppWorld, { result }: ITestCaseHookParameter) {
  if (result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, "image/png");
  }

  await this.resetBrowser();
});

AfterAll({ timeout: 30000 }, async function () {
  await AppWorld.closeSharedBrowser();
  await shutdownServers();
});

