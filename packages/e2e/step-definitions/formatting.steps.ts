import { Given, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  /^I am viewing the "([^"]*)" page$/,
  async function (this: AppWorld, pageTitle: string) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    
    // Navigate to the page using the sidebar
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
    
    // Find and click the page in the sidebar
    const pageButton = page.getByRole("button", { name: new RegExp(`Navigate to ${pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i") });
    await pageButton.click();
    
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    
    // Wait for content to be rendered
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
);

Then(
  /^I should see an H(\d) heading with text "([^"]*)"$/,
  async function (this: AppWorld, level: string, text: string) {
    const page = await this.ensurePage();
    const heading = page.locator(`h${level}`, { hasText: text });
    await expect(heading).toBeVisible();
  }
);

Then(
  /^I should see bold text "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    // Wait for MDX content to load
    await page.waitForSelector('.prose', { timeout: 5000 });
    // Wait a bit more for MDX compilation
    await page.waitForTimeout(500);
    
    // Check if strong or b element exists with the text
    const strongElement = page.locator('strong', { hasText: text });
    const boldElement = page.locator('b', { hasText: text });
    
    // First check if elements exist (count > 0)
    const strongCount = await strongElement.count();
    const boldCount = await boldElement.count();
    
    if (strongCount > 0) {
      await expect(strongElement.first()).toBeVisible();
    } else if (boldCount > 0) {
      await expect(boldElement.first()).toBeVisible();
    } else {
      // If neither exists, try scrolling to make sure they're in viewport
      const allStrong = page.locator('strong');
      const allBold = page.locator('b');
      const strongWithText = allStrong.filter({ hasText: text });
      const boldWithText = allBold.filter({ hasText: text });
      
      if (await strongWithText.count() > 0) {
        await strongWithText.first().scrollIntoViewIfNeeded();
        await expect(strongWithText.first()).toBeVisible();
      } else if (await boldWithText.count() > 0) {
        await boldWithText.first().scrollIntoViewIfNeeded();
        await expect(boldWithText.first()).toBeVisible();
      } else {
        throw new Error(`Bold text "${text}" not found`);
      }
    }
  }
);

Then(
  /^I should see italic text "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    // Wait for MDX content to load
    await page.waitForSelector('.prose', { timeout: 5000 });
    // Wait a bit more for MDX compilation
    await page.waitForTimeout(500);
    
    // Check if em or i element exists with the text
    const emElement = page.locator('em', { hasText: text });
    const iElement = page.locator('i', { hasText: text });
    
    // First check if elements exist (count > 0)
    const emCount = await emElement.count();
    const iCount = await iElement.count();
    
    if (emCount > 0) {
      await expect(emElement.first()).toBeVisible();
    } else if (iCount > 0) {
      await expect(iElement.first()).toBeVisible();
    } else {
      // If neither exists, try scrolling to make sure they're in viewport
      const allEm = page.locator('em');
      const allI = page.locator('i');
      const emWithText = allEm.filter({ hasText: text });
      const iWithText = allI.filter({ hasText: text });
      
      if (await emWithText.count() > 0) {
        await emWithText.first().scrollIntoViewIfNeeded();
        await expect(emWithText.first()).toBeVisible();
      } else if (await iWithText.count() > 0) {
        await iWithText.first().scrollIntoViewIfNeeded();
        await expect(iWithText.first()).toBeVisible();
      } else {
        throw new Error(`Italic text "${text}" not found`);
      }
    }
  }
);

Then(
  /^I should see inline code "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    const codeElement = page.locator('code', { hasText: text });
    await expect(codeElement).toBeVisible();
  }
);

Then(
  /^I should see a list item "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    const listItem = page.locator('li', { hasText: text });
    await expect(listItem).toBeVisible();
  }
);

Then(
  /^I should see a numbered list item "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    // Check for ordered list (ol) containing the item
    const listItem = page.locator('ol li', { hasText: text });
    await expect(listItem).toBeVisible();
  }
);

Then(
  /^I should see a link with text "([^"]*)" and href "([^"]*)"$/,
  async function (this: AppWorld, linkText: string, href: string) {
    const page = await this.ensurePage();
    const link = page.locator('a', { hasText: linkText });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
);

Then(
  /^I should see a code block containing "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    // Wait for MDX content to load
    await page.waitForSelector('.prose', { timeout: 5000 });
    // Wait a bit more for MDX compilation
    await page.waitForTimeout(500);
    
    // Code blocks are typically wrapped in <pre><code> or just <pre>
    const preCodeBlock = page.locator('pre code', { hasText: text });
    const preBlock = page.locator('pre', { hasText: text });
    
    // First check if elements exist (count > 0)
    const preCodeCount = await preCodeBlock.count();
    const preCount = await preBlock.count();
    
    if (preCodeCount > 0) {
      await preCodeBlock.first().scrollIntoViewIfNeeded();
      await expect(preCodeBlock.first()).toBeVisible();
    } else if (preCount > 0) {
      await preBlock.first().scrollIntoViewIfNeeded();
      await expect(preBlock.first()).toBeVisible();
    } else {
      // Try finding by text content more broadly
      const allPre = page.locator('pre');
      const allPreCode = page.locator('pre code');
      
      let found = false;
      for (let i = 0; i < await allPre.count(); i++) {
        const preText = await allPre.nth(i).textContent();
        if (preText && preText.includes(text)) {
          await allPre.nth(i).scrollIntoViewIfNeeded();
          await expect(allPre.nth(i)).toBeVisible();
          found = true;
          break;
        }
      }
      
      if (!found) {
        for (let i = 0; i < await allPreCode.count(); i++) {
          const codeText = await allPreCode.nth(i).textContent();
          if (codeText && codeText.includes(text)) {
            await allPreCode.nth(i).scrollIntoViewIfNeeded();
            await expect(allPreCode.nth(i)).toBeVisible();
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        throw new Error(`Code block containing "${text}" not found`);
      }
    }
  }
);

Then(
  /^I should see a blockquote containing "([^"]*)"$/,
  async function (this: AppWorld, text: string) {
    const page = await this.ensurePage();
    const blockquote = page.locator('blockquote', { hasText: text });
    await expect(blockquote).toBeVisible();
  }
);

Then(
  "I should see a table element",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  }
);

Then(
  /^the table should have header cells with "([^"]*)", "([^"]*)", and "([^"]*)"$/,
  async function (this: AppWorld, header1: string, header2: string, header3: string) {
    const page = await this.ensurePage();
    const table = page.locator('table').first();
    const thead = table.locator('thead');
    await expect(thead).toBeVisible();
    
    const headerCells = thead.locator('th');
    const header1Cell = headerCells.filter({ hasText: header1 });
    const header2Cell = headerCells.filter({ hasText: header2 });
    const header3Cell = headerCells.filter({ hasText: header3 });
    
    await expect(header1Cell).toBeVisible();
    await expect(header2Cell).toBeVisible();
    await expect(header3Cell).toBeVisible();
  }
);

Then(
  /^the table should have data cells with "([^"]*)", "([^"]*)", and "([^"]*)"$/,
  async function (this: AppWorld, data1: string, data2: string, data3: string) {
    const page = await this.ensurePage();
    const table = page.locator('table').first();
    const tbody = table.locator('tbody');
    await expect(tbody).toBeVisible();
    
    const dataCells = tbody.locator('td');
    const data1Cell = dataCells.filter({ hasText: data1 });
    const data2Cell = dataCells.filter({ hasText: data2 });
    const data3Cell = dataCells.filter({ hasText: data3 });
    
    await expect(data1Cell).toBeVisible();
    await expect(data2Cell).toBeVisible();
    await expect(data3Cell).toBeVisible();
  }
);

