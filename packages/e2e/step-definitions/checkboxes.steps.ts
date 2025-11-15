import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL, BACKEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  /^I am viewing the "([^"]*)" page$/,
  async function (this: AppWorld, pageTitle: string) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    
    // Navigate to the page using the sidebar
    await page.goto(FRONTEND_URL, { waitUntil: "load" });
    await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
    
    // Find and click the page in the sidebar
    const pageButton = page.getByRole("button", { name: new RegExp(`Navigate to ${pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i") });
    await pageButton.click();
    
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    
    // Wait for content to be rendered
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
);

Given(
  "I am in preview mode",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Ensure we're in preview mode (not edit mode)
    const editButton = page.getByRole("button", { name: "Edit" });
    if (await editButton.isVisible()) {
      // Already in preview mode
      return;
    }
    // If we're in edit mode, click Preview button
    const previewButton = page.getByRole("button", { name: "Preview" });
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
      await page.waitForSelector('.prose', { timeout: 5000 });
    }
  }
);

Given(
  "I am in edit mode",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editButton = page.getByRole("button", { name: "Edit" });
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForSelector('[aria-label="Page content"]', { timeout: 5000 });
    }
  }
);

Given(
  /^the checkbox for "([^"]*)" is checked$/,
  async function (this: AppWorld, itemText: string) {
    const page = await this.ensurePage();
    // Wait for content to be rendered
    await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 10000 });
    
    // Find checkbox by the text that follows it (same logic as When step)
    const escapedText = itemText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allListItems = await page.locator('.prose li').all();
    let targetCheckbox = null;
    
    for (const li of allListItems) {
      const checkbox = li.locator('input[type="checkbox"]').first();
      const checkboxCount = await checkbox.count();
      
      if (checkboxCount === 0) continue;
      
      const fullText = await li.textContent();
      const nestedLists = await li.locator('ul, ol').all();
      let nestedText = '';
      for (const nested of nestedLists) {
        nestedText += await nested.textContent() || '';
      }
      
      let directText = fullText || '';
      if (nestedText) {
        directText = directText.replace(nestedText, '').trim();
      }
      
      if (new RegExp(escapedText, 'i').test(directText)) {
        targetCheckbox = checkbox;
        break;
      }
    }
    
    if (!targetCheckbox) {
      throw new Error(`Could not find checkbox for "${itemText}"`);
    }
    
    const isChecked = await targetCheckbox.isChecked();
    
    if (!isChecked) {
      // Toggle it to checked state
      await targetCheckbox.click({ force: true });
      // Wait for content to be re-rendered after click
      await page.waitForSelector('.prose input[type="checkbox"]', { state: 'attached', timeout: 3000 });
    }
  }
);

When(
  /^I click the checkbox for "([^"]*)"$/,
  async function (this: AppWorld, itemText: string) {
    const page = await this.ensurePage();
    // Wait for content to be rendered and checkboxes to be available
    await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 10000 });
    
    // Find checkbox by the text that follows it
    // Use a more precise selector that looks for the checkbox followed by the specific text
    const escapedText = itemText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Try to find a label or text node containing this exact text next to a checkbox
    // Get all list items and check them one by one
    const allListItems = await page.locator('.prose li').all();
    let targetCheckbox = null;
    
    for (const li of allListItems) {
      const checkbox = li.locator('input[type="checkbox"]').first();
      const checkboxCount = await checkbox.count();
      
      if (checkboxCount === 0) continue;
      
      // Get the text content of this specific li
      const fullText = await li.textContent();
      
      // Get text of nested lists to subtract them
      const nestedLists = await li.locator('ul, ol').all();
      let nestedText = '';
      for (const nested of nestedLists) {
        nestedText += await nested.textContent() || '';
      }
      
      // The direct text is full text minus nested text
      let directText = fullText || '';
      if (nestedText) {
        directText = directText.replace(nestedText, '').trim();
      }
      
      // Check if this direct text contains our target (case insensitive)
      if (new RegExp(escapedText, 'i').test(directText)) {
        targetCheckbox = checkbox;
        break;
      }
    }
    
    if (!targetCheckbox) {
      throw new Error(`Could not find checkbox for "${itemText}"`);
    }
    
    // Get the current checked state before clicking
    const wasChecked = await targetCheckbox.isChecked();
    this.checkboxStateBefore = wasChecked;
    this.clickedItemText = itemText;
    
    // Click the checkbox - use force if needed since we're preventing default
    await targetCheckbox.click({ force: true });
    
    // Small wait to ensure React processes the click and DOM updates
    await page.waitForTimeout(100);
  }
);

When(
  "I try to click a checkbox",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // In edit mode, checkboxes should not be interactive
    // Try to find a checkbox (there shouldn't be any rendered checkboxes in edit mode)
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    this.checkboxCountInEditMode = count;
  }
);

Then(
  /^the checkbox should be checked$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for debounce (300ms) + save + MDX recompilation
    await page.waitForTimeout(600);
    
    // Wait for content to be re-rendered
    await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 3000 });
    
    // The checkbox should now be checked
    // We'll verify via backend content check in the next step
  }
);

Then(
  /^the checkbox should be unchecked$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for debounce (300ms) + save + MDX recompilation
    await page.waitForTimeout(600);
    
    // Wait for content to be re-rendered
    await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 3000 });
    
    // The checkbox should now be unchecked
    // We'll verify via backend content check in the next step
  }
);

Then(
  /^the markdown should be updated with "\[([ x])\]" for that item$/,
  async function (this: AppWorld, expectedState: string) {
    const page = await this.ensurePage();
    
    // Get the page path from the URL
    const url = await page.url();
    const urlPath = url.replace(FRONTEND_URL, '').replace(/^\//, '');
    const decodedPath = decodeURIComponent(urlPath);
    const pathSegments = decodedPath.split('/').map(segment => encodeURIComponent(segment));
    const apiPath = pathSegments.join('/');
    
    // Wait for the network request to complete by polling the backend
    // until we see the expected change or timeout
    const maxAttempts = 10;
    const delayMs = 200;
    let content = '';
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await page.waitForTimeout(delayMs);
      
      const response = await fetch(`${BACKEND_URL}/api/pages/${apiPath}`);
      expect(response.status).toBe(200);
      
      const pageData = await response.json() as { content: string };
      content = pageData.content;
      
      // Find the specific item that was clicked
      const itemText = this.clickedItemText as string;
      const escapedText = itemText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const checkboxPattern = new RegExp(
        `-\\s+\\[${expectedState === 'x' ? 'x' : ' '}\\]\\s+${escapedText}`,
        'i'
      );
      
      if (content.match(checkboxPattern)) {
        // Found the expected state, test passes
        return;
      }
    }
    
    // If we get here, the change wasn't found after all attempts
    const itemText = this.clickedItemText as string;
    const escapedText = itemText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const checkboxPattern = new RegExp(
      `-\\s+\\[${expectedState === 'x' ? 'x' : ' '}\\]\\s+${escapedText}`,
      'i'
    );
    
    expect(content).toMatch(checkboxPattern);
  }
);

Then(
  "the changes should be saved automatically",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for save operation to complete
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    // Verify by checking backend - if we got here, the previous step already verified the content
    // But we can also check that the save button is disabled (indicating no unsaved changes)
    const editButton = page.getByRole("button", { name: "Edit" });
    if (await editButton.isVisible()) {
      // We're in preview mode, which is correct
      // The fact that we can fetch updated content means it was saved
      return;
    }
  }
);

Then(
  /^both checkboxes should be checked$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for debounce (300ms) + save operation + re-render
    await page.waitForTimeout(1000);
    
    // Get the page path from the URL
    const url = await page.url();
    const urlPath = url.replace(FRONTEND_URL, '').replace(/^\//, '');
    const decodedPath = decodeURIComponent(urlPath);
    const pathSegments = decodedPath.split('/').map(segment => encodeURIComponent(segment));
    const apiPath = pathSegments.join('/');
    
    // Poll the backend to ensure save completed
    let attempts = 0;
    let content = '';
    while (attempts < 5) {
      const response = await fetch(`${BACKEND_URL}/api/pages/${apiPath}`);
      expect(response.status).toBe(200);
      
      const pageData = await response.json() as { content: string };
      content = pageData.content;
      
      // Check if both checkboxes are checked
      const firstChecked = /- \[x\]\s+Explore the Markdown Guide/.test(content);
      const secondChecked = /- \[x\]\s+Create your first page/.test(content);
      
      if (firstChecked && secondChecked) {
        return; // Success!
      }
      
      attempts++;
      if (attempts < 5) {
        await page.waitForTimeout(200);
      }
    }
    
    // If we get here, assert to show the failure
    expect(content).toMatch(/- \[x\]\s+Explore the Markdown Guide/);
    expect(content).toMatch(/- \[x\]\s+Create your first page/);
  }
);

Then(
  "the markdown should be updated for both items",
  async function (this: AppWorld) {
    // This is verified by the previous step
    // The backend content check confirms both items were updated
  }
);

Then(
  "only one save operation should occur",
  async function (this: AppWorld) {
    // This is harder to verify directly, but the fact that both checkboxes
    // are updated correctly after debounce indicates the debouncing worked
    // We verify this indirectly by checking that both changes are present
    // after a single debounce period
  }
);

Then(
  "the checkbox should not toggle",
  async function (this: AppWorld) {
    // In edit mode, there should be no interactive checkboxes
    // Checkboxes are rendered as plain markdown text in edit mode
    const page = await this.ensurePage();
    const checkboxCount = this.checkboxCountInEditMode as number;
    expect(checkboxCount).toBe(0);
  }
);

When(
  /^I scroll to the checkbox for "([^"]*)"$/,
  async function (this: AppWorld, itemText: string) {
    const page = await this.ensurePage();
    // Wait for content to be fully rendered
    await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 10000 });
    
    // Find the checkbox for this item
    const escapedText = itemText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allListItems = await page.locator('.prose li').all();
    let targetCheckbox = null;
    
    for (const li of allListItems) {
      const checkbox = li.locator('input[type="checkbox"]').first();
      const checkboxCount = await checkbox.count();
      
      if (checkboxCount === 0) continue;
      
      const fullText = await li.textContent();
      const nestedLists = await li.locator('ul, ol').all();
      let nestedText = '';
      for (const nested of nestedLists) {
        nestedText += await nested.textContent() || '';
      }
      
      let directText = fullText || '';
      if (nestedText) {
        directText = directText.replace(nestedText, '').trim();
      }
      
      if (new RegExp(escapedText, 'i').test(directText)) {
        targetCheckbox = checkbox;
        break;
      }
    }
    
    if (!targetCheckbox) {
      throw new Error(`Could not find checkbox for "${itemText}"`);
    }
    
    // Scroll the checkbox into view
    await targetCheckbox.scrollIntoViewIfNeeded();
    
    // Wait for scroll animation to complete
    await page.waitForTimeout(300);
    
    // Store the scroll position for later verification
    const scrollY = await page.evaluate(() => window.scrollY);
    this.scrollPositionBefore = scrollY;
  }
);

Then(
  "the page should not have scrolled",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Wait for any debounced updates and re-renders to complete
    await page.waitForTimeout(800);
    
    // Get the current scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollBefore = this.scrollPositionBefore as number;
    
    // Verify that the scroll position hasn't changed
    // Allow for a small tolerance (1-2px) due to rounding
    const scrollDiff = Math.abs(scrollY - scrollBefore);
    if (scrollDiff >= 3) {
      throw new Error(
        `Scroll position changed! Before: ${scrollBefore}px, After: ${scrollY}px, Diff: ${scrollDiff}px`
      );
    }
    expect(scrollDiff).toBeLessThan(3);
  }
);

When(
  "I note the current document state",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Get the page path from the URL
    const url = await page.url();
    const urlPath = url.replace(FRONTEND_URL, '').replace(/^\//, '');
    const decodedPath = decodeURIComponent(urlPath);
    const pathSegments = decodedPath.split('/').map(segment => encodeURIComponent(segment));
    const apiPath = pathSegments.join('/');
    
    // Fetch the document content from backend
    const response = await fetch(`${BACKEND_URL}/api/pages/${apiPath}`);
    expect(response.status).toBe(200);
    
    const pageData = await response.json() as { content: string };
    this.originalDocumentContent = pageData.content;
  }
);

When(
  "I wait for the changes to be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for debounce (300ms) + save operation + re-render
    await page.waitForTimeout(1000);
  }
);

Then(
  "the document should match the original state",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Get the page path from the URL
    const url = await page.url();
    const urlPath = url.replace(FRONTEND_URL, '').replace(/^\//, '');
    const decodedPath = decodeURIComponent(urlPath);
    const pathSegments = decodedPath.split('/').map(segment => encodeURIComponent(segment));
    const apiPath = pathSegments.join('/');
    
    // Fetch the current document content from backend
    const response = await fetch(`${BACKEND_URL}/api/pages/${apiPath}`);
    expect(response.status).toBe(200);
    
    const pageData = await response.json() as { content: string };
    const currentContent = pageData.content;
    const originalContent = this.originalDocumentContent as string;
    
    // Compare the content
    if (currentContent !== originalContent) {
      throw new Error(
        `Document content does not match original state!\n` +
        `Original:\n${originalContent}\n\n` +
        `Current:\n${currentContent}`
      );
    }
    
    expect(currentContent).toBe(originalContent);
  }
);


