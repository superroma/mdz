# Developer Guide - Using Common Steps & Helpers

## Quick Start

When writing new Cucumber step definitions, **always check if a common step or helper already exists** before creating new code.

---

## 1. Common Steps (Use First!)

Located in: `step-definitions/common-steps.ts`

### Page Setup Steps

```gherkin
# Navigate to any page
Given I am viewing a page

# Navigate to a specific page by title
Given I am viewing the "Getting Started" page
Given I am viewing the "Tasks" page

# Navigate to a page in a specific mode
Given I am viewing a page in view mode
Given I am viewing a page in edit mode
Given I am viewing a page in preview mode

# Alias for "I am viewing a page"
Given I am on a page
```

### Mode Switching Steps

```gherkin
# Switch to any mode (PARAMETERIZED!)
Given I am in edit mode
Given I am in preview mode
Given I am in view mode
And I am in edit mode
```

### Button Clicking Steps

```gherkin
# Click common buttons by name
When I click the Edit button
When I click the Save button
When I click the Preview button
When I click the Delete button
When I click the Back button
```

### Assertion Steps

```gherkin
# Verify editor visibility
Then I should see the markdown source editor

# Verify content saved
Then the content should be saved

# Verify URL updated
Then the URL should update to match the page path
Then the URL should update if needed
```

---

## 2. Helper Functions

Located in: `support/test-helpers.ts`

### Import What You Need

```typescript
import { 
  setupPage,
  waitForPageLoad,
  waitForNetworkIdle,
  navigateToPageByTitle,
  switchToMode,
  verifyNavigation,
  clickButton
} from "../support/test-helpers";
```

### setupPage() - Use for ALL page navigation

**Replaces:**
```typescript
// ❌ DON'T DO THIS
await ensureServersRunning();
const page = await this.ensurePage();
await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
```

**Use instead:**
```typescript
// ✅ DO THIS
const page = await setupPage(this);

// With a path:
const page = await setupPage(this, "/Welcome");
const page = await setupPage(this, "/Welcome/Tasks/Write%20Tests");
```

### waitForPageLoad() - After navigation

```typescript
const page = await setupPage(this);
await waitForPageLoad(page); // Waits for page-title-input
```

### waitForNetworkIdle() - After save/update operations

**Replaces:**
```typescript
// ❌ DON'T DO THIS
await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
```

**Use instead:**
```typescript
// ✅ DO THIS
await waitForNetworkIdle(page);
```

### navigateToPageByTitle() - Navigate via sidebar

```typescript
const page = await setupPage(this);
await navigateToPageByTitle(page, "Getting Started");
await navigateToPageByTitle(page, "Write Tests");
```

### switchToMode() - Change edit/preview mode

**Replaces:**
```typescript
// ❌ DON'T DO THIS - lots of boilerplate
const editButton = page.getByRole("button", { name: "Edit" });
if (await editButton.isVisible()) {
  await editButton.click();
  await page.waitForSelector('[aria-label="Page content"]', { timeout: 5000 });
}
```

**Use instead:**
```typescript
// ✅ DO THIS
await switchToMode(page, 'edit');
await switchToMode(page, 'preview');
await switchToMode(page, 'view'); // alias for preview
```

### clickButton() - Smart button clicking

```typescript
// Automatically uses test IDs when available
await clickButton(page, "Edit");    // Uses edit-button test ID
await clickButton(page, "Save");    // Uses save-button test ID
await clickButton(page, "Preview"); // Uses preview-button test ID
await clickButton(page, "Delete");  // Uses delete-page-button test ID
await clickButton(page, "Back");    // Uses back-button test ID

// Falls back to role for other buttons
await clickButton(page, "Submit");  // Uses getByRole
```

### verifyNavigation() - Assert URL changed

```typescript
// Verify navigation to any non-root page
await verifyNavigation(page);

// Verify navigation to specific pattern
await verifyNavigation(page, /Untitled/);
await verifyNavigation(page, /Welcome\/Tasks/);
```

---

## 3. Writing New Steps - Best Practices

### ✅ DO: Use Common Steps When Possible

```typescript
// ❌ BAD - Creating duplicate step
Given("I am on the homepage", async function() {
  await ensureServersRunning();
  const page = await this.ensurePage();
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
});

// ✅ GOOD - Use existing common step
// Just write in feature file: "Given I am viewing a page"
```

### ✅ DO: Use Helpers for Setup

```typescript
Given("I am editing a task page", async function() {
  // ✅ Use helpers
  const page = await setupPage(this, "/Welcome/Tasks");
  await waitForPageLoad(page);
  await clickButton(page, "Edit");
});
```

### ✅ DO: Parameterize When Possible

```typescript
// ❌ BAD - Two separate steps
Given("I click the save button", async function() { ... });
Given("I click the cancel button", async function() { ... });

// ✅ GOOD - One parameterized step
Given(/I click the (\w+) button/, async function(buttonName: string) {
  const page = await this.ensurePage();
  await clickButton(page, buttonName);
});
```

### ✅ DO: Keep Step-Specific Logic in Step Files

```typescript
// ✅ GOOD - Checkbox logic stays in checkboxes.steps.ts
When(
  /^I click the checkbox for "([^"]*)"$/,
  async function (this: AppWorld, itemText: string) {
    const page = await this.ensurePage();
    // Complex checkbox-finding logic here
    // This is specific to checkboxes, so it belongs here
  }
);
```

### ❌ DON'T: Copy-Paste Setup Code

```typescript
// ❌ BAD
Given("Some new step", async function() {
  await ensureServersRunning();
  const page = await this.ensurePage();
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
  // ... rest of logic
});

// ✅ GOOD
Given("Some new step", async function() {
  const page = await setupPage(this);
  await waitForPageLoad(page);
  // ... rest of logic
});
```

### ❌ DON'T: Inline Wait Patterns

```typescript
// ❌ BAD
await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});

// ✅ GOOD
await waitForNetworkIdle(page);
```

---

## 4. Quick Reference Table

| Need to... | Use... | Example |
|------------|--------|---------|
| Navigate to a page | `setupPage()` | `const page = await setupPage(this, "/Welcome");` |
| Wait for page load | `waitForPageLoad()` | `await waitForPageLoad(page);` |
| Wait after save | `waitForNetworkIdle()` | `await waitForNetworkIdle(page);` |
| Switch modes | `switchToMode()` | `await switchToMode(page, 'edit');` |
| Click a button | `clickButton()` | `await clickButton(page, "Save");` |
| Navigate by title | `navigateToPageByTitle()` | `await navigateToPageByTitle(page, "Tasks");` |
| Verify navigation | `verifyNavigation()` | `await verifyNavigation(page);` |

---

## 5. Common Patterns

### Pattern 1: Setup and View a Page

```typescript
Given("I am viewing some specific page", async function() {
  const page = await setupPage(this);
  await waitForPageLoad(page);
  // Additional setup...
});
```

### Pattern 2: Navigate to Page and Switch Mode

```typescript
Given("I am editing a specific page", async function() {
  const page = await setupPage(this, "/Welcome/Tasks");
  await waitForPageLoad(page);
  await switchToMode(page, 'edit');
});
```

### Pattern 3: Perform Action and Wait

```typescript
When("I save the page", async function() {
  const page = await this.ensurePage();
  await clickButton(page, "Save");
  await waitForNetworkIdle(page);
});
```

### Pattern 4: Navigate via Sidebar

```typescript
When("I navigate to a page by clicking in sidebar", async function() {
  const page = await setupPage(this);
  await navigateToPageByTitle(page, "Getting Started");
  await page.waitForSelector('.prose', { timeout: 5000 });
});
```

---

## 6. Debugging Tips

### Check if Common Step Exists

1. Look in `step-definitions/common-steps.ts`
2. Search for similar step definitions in other files
3. Check this guide

### Step Not Matching?

```typescript
// Common issue: Missing word boundary
Given("I am in edit mode", ...)        // ✅ Matches {word}
Given("I am in edit-mode", ...)        // ❌ Won't match {word} (has hyphen)

// Use regex for complex patterns
Given(/^I am in ([\w-]+) mode$/, ...)  // ✅ Matches "edit-mode"
```

### Helper Not Working?

```typescript
// Check imports
import { setupPage, waitForPageLoad } from "../support/test-helpers";

// Verify you're passing the right arguments
const page = await setupPage(this);      // ✅ Pass world
const page = await setupPage(this.page); // ❌ Pass page (wrong!)
```

---

## 7. Adding New Helpers

If you need to add a new helper:

1. **Check if it's truly reusable** (used 3+ times)
2. **Add to `test-helpers.ts`** with clear documentation
3. **Export it** and add to import examples
4. **Update this guide** with usage examples

```typescript
// Example: Adding a new helper
/**
 * Describes what this helper does
 * @param page - The Playwright page
 * @param something - Some parameter
 */
export async function myNewHelper(page: Page, something: string): Promise<void> {
  // Implementation
}
```

---

## 8. Key Principles

1. **DRY (Don't Repeat Yourself)** - If you copy-paste code twice, make it a helper
2. **Parameterize** - Use `{word}` or regex patterns instead of separate steps
3. **Common First** - Always check common-steps.ts before creating new steps
4. **Document** - Add clear JSDoc comments to helpers
5. **Test** - Verify TypeScript compiles: `npx tsc --noEmit`

---

## Need Help?

- Check `BEFORE_AFTER_COMPARISON.md` for examples
- Read `REFACTORING_SUMMARY.md` for overview
- Look at existing step files for patterns
- Ask the team before creating duplicate code

---

**Remember**: The goal is **reusable, maintainable, parameterized** step definitions. Every line of duplicate code is a future maintenance burden!
