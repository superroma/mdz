import { test, expect } from "@playwright/test";
import { ensureServersRunning } from "../support/server-manager";
import { FRONTEND_URL } from "../support/constants";

test.beforeAll(async () => {
  await ensureServersRunning();
});

test("markdown formatting has correct CSS styles applied", async ({ page }) => {
  // Navigate to Markdown Guide page
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
  
  // Click on Markdown Guide page
  const markdownGuideButton = page.getByRole("button", { name: /Navigate to Markdown Guide/i });
  await markdownGuideButton.click();
  
  await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  await page.waitForSelector('.prose', { timeout: 5000 });

  // Check that bold text has font-weight: bold or >= 600
  const strongElement = page.locator('strong', { hasText: 'Bold text' });
  const boldElement = page.locator('b', { hasText: 'Bold text' });
  const boldText = (await strongElement.count() > 0) ? strongElement.first() : boldElement.first();
  await expect(boldText).toBeVisible();
  const boldFontWeight = await boldText.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return parseInt(style.fontWeight) || style.fontWeight;
  });
  expect(Number(boldFontWeight) >= 600 || boldFontWeight === 'bold').toBeTruthy();

  // Check that italic text has font-style: italic
  const emElement = page.locator('em', { hasText: 'Italic text' });
  const iElement = page.locator('i', { hasText: 'Italic text' });
  const italicText = (await emElement.count() > 0) ? emElement.first() : iElement.first();
  await expect(italicText).toBeVisible();
  const italicFontStyle = await italicText.evaluate((el) => {
    return window.getComputedStyle(el).fontStyle;
  });
  expect(italicFontStyle).toBe('italic');

  // Check that headings have larger font sizes than regular text
  const h1 = page.locator('h1').first();
  const h2 = page.locator('h2').first();
  const regularText = page.locator('.prose p').first();
  
  await expect(h1).toBeVisible();
  await expect(h2).toBeVisible();
  await expect(regularText).toBeVisible();

  const h1FontSize = await h1.evaluate((el) => {
    return parseFloat(window.getComputedStyle(el).fontSize);
  });
  const h2FontSize = await h2.evaluate((el) => {
    return parseFloat(window.getComputedStyle(el).fontSize);
  });
  const regularFontSize = await regularText.evaluate((el) => {
    return parseFloat(window.getComputedStyle(el).fontSize);
  });

  // Headings should be larger than regular text
  expect(h1FontSize).toBeGreaterThan(regularFontSize);
  expect(h2FontSize).toBeGreaterThan(regularFontSize);
  expect(h1FontSize).toBeGreaterThan(h2FontSize);

  // Check that code elements have monospace font
  const inlineCode = page.locator('code', { hasText: 'Inline code' }).first();
  await expect(inlineCode).toBeVisible();
  const codeFontFamily = await inlineCode.evaluate((el) => {
    return window.getComputedStyle(el).fontFamily.toLowerCase();
  });
  expect(codeFontFamily).toContain('monospace');

  // Check that code blocks have monospace font
  const codeBlock = page.locator('pre code').first();
  if (await codeBlock.isVisible().catch(() => false)) {
    const codeBlockFontFamily = await codeBlock.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily.toLowerCase();
    });
    expect(codeBlockFontFamily).toContain('monospace');
  }

  // Check that links have different color than regular text
  const link = page.locator('a', { hasText: 'Link text' }).first();
  await expect(link).toBeVisible();
  const linkColor = await link.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });
  const regularColor = await regularText.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });
  // Links should have a different color (usually blue)
  expect(linkColor).not.toBe(regularColor);

  // Check that blockquotes have distinct styling (usually left border or different background)
  const blockquote = page.locator('blockquote').first();
  if (await blockquote.isVisible().catch(() => false)) {
    const blockquoteStyle = await blockquote.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderLeft: style.borderLeft,
        paddingLeft: style.paddingLeft,
        marginLeft: style.marginLeft,
      };
    });
    // Blockquotes typically have left border or padding
    const hasLeftBorder = blockquoteStyle.borderLeft !== '0px' && blockquoteStyle.borderLeft !== 'none';
    const hasLeftPadding = parseFloat(blockquoteStyle.paddingLeft) > 0;
    const hasLeftMargin = parseFloat(blockquoteStyle.marginLeft) > 0;
    expect(hasLeftBorder || hasLeftPadding || hasLeftMargin).toBeTruthy();
  }
});

test("markdown tables are rendered as HTML tables", async ({ page }) => {
  // Navigate to Markdown Guide page
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
  
  // Click on Markdown Guide page
  const markdownGuideButton = page.getByRole("button", { name: /Navigate to Markdown Guide/i });
  await markdownGuideButton.click();
  
  await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  await page.waitForSelector('.prose', { timeout: 5000 });

  // Check that a table element exists
  const table = page.locator('table').first();
  await expect(table).toBeVisible();

  // Check that table has thead (header row)
  const thead = table.locator('thead');
  await expect(thead).toBeVisible();

  // Check that table has tbody (data rows)
  const tbody = table.locator('tbody');
  await expect(tbody).toBeVisible();

  // Check that header cells exist with correct content
  const headerCells = thead.locator('th');
  const headerCount = await headerCells.count();
  expect(headerCount).toBeGreaterThanOrEqual(3); // At least 3 columns
  
  // Verify header content
  const column1Header = headerCells.filter({ hasText: 'Column 1' });
  const column2Header = headerCells.filter({ hasText: 'Column 2' });
  const column3Header = headerCells.filter({ hasText: 'Column 3' });
  await expect(column1Header).toBeVisible();
  await expect(column2Header).toBeVisible();
  await expect(column3Header).toBeVisible();

  // Check that data cells exist
  const dataCells = tbody.locator('td');
  const dataCellCount = await dataCells.count();
  expect(dataCellCount).toBeGreaterThanOrEqual(3); // At least 3 data cells

  // Verify data content
  const data1 = dataCells.filter({ hasText: 'Data 1' });
  const data2 = dataCells.filter({ hasText: 'Data 2' });
  const data3 = dataCells.filter({ hasText: 'Data 3' });
  await expect(data1).toBeVisible();
  await expect(data2).toBeVisible();
  await expect(data3).toBeVisible();

  // Check that table has proper table styling (display: table)
  const tableDisplay = await table.evaluate((el) => {
    return window.getComputedStyle(el).display;
  });
  expect(tableDisplay).toBe('table');

  // Check that table cells have proper styling
  const firstCell = headerCells.first();
  const cellDisplay = await firstCell.evaluate((el) => {
    return window.getComputedStyle(el).display;
  });
  expect(cellDisplay).toBe('table-cell');
});

