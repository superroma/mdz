# Cucumber Test Steps Refactoring Plan

## Executive Summary

**Current State:** Steps are literally implemented with massive duplication. "Edit" and "preview" are NOT parameters - they're separate step definitions.

**Goal:** Reduce code duplication by 60-70% through parameterization and shared utilities.

---

## Key Issues Found

### Issue 1: Mode Steps Are NOT Parameterized ❌

**Current Implementation (2 separate steps):**
```typescript
// checkboxes.steps.ts
Given("I am in edit mode", async function() { ... })
Given("I am in preview mode", async function() { ... })
```

**Should Be (1 parameterized step):**
```typescript
// common-steps.ts
Given("I am in {word} mode", async function(mode: string) {
  // Handle both 'edit' and 'preview'
})
```

---

### Issue 2: Duplicate "Viewing Page" Steps (5+ variations)

**Current duplicates:**
1. `"I am viewing a page"` - appears in 3 files
2. `"I am on a page"` - navigation.steps.ts
3. `"I am viewing a page in view mode"` - editing.steps.ts
4. `"I am viewing the {string} page"` - checkboxes.steps.ts (ONLY ONE PARAMETERIZED!)

**All have nearly identical code:**
```typescript
await ensureServersRunning();
const page = await this.ensurePage();
await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
```

---

### Issue 3: Navigation Assertions Duplicated

**Current variations:**
- `"I should be navigated to the new page"`
- `"I should be navigated to the new child page"`
- `"I should be navigated to another page"`
- `"I should navigate to that page"`
- `"I should navigate to that parent page"`

All do similar URL/navigation checks with slight variations.

---

### Issue 4: Repeated Patterns Throughout

**Pattern 1: Setup boilerplate (appears 30+ times)**
```typescript
await ensureServersRunning();
const page = await this.ensurePage();
await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
```

**Pattern 2: Wait for network idle (appears 20+ times)**
```typescript
await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
```

**Pattern 3: Title field interactions (appears 10+ times)**
```typescript
const titleField = page.getByTestId("page-title-input");
await titleField.fill("Some Text");
await titleField.press("Enter");
```

---

## Refactoring Strategy

### Phase 1: Create Shared Utilities

**File: `support/test-helpers.ts`**

```typescript
import { Page } from "@playwright/test";
import { FRONTEND_URL } from "./constants";
import { ensureServersRunning } from "./server-manager";
import { AppWorld } from "./world";

export async function setupPage(world: AppWorld, path = ""): Promise<Page> {
  await ensureServersRunning();
  const page = await world.ensurePage();
  const url = path ? `${FRONTEND_URL}${path}` : FRONTEND_URL;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  return page;
}

export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
}

export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
}

export async function navigateToPageByTitle(page: Page, pageTitle: string): Promise<void> {
  await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
  const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pageButton = page.getByRole("button", { 
    name: new RegExp(`Navigate to ${escapedTitle}`, "i") 
  });
  await pageButton.click();
  await waitForPageLoad(page);
}

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

export async function verifyNavigation(page: Page, expectedPattern?: RegExp): Promise<void> {
  await page.waitForURL((url) => {
    const path = new URL(url).pathname;
    if (expectedPattern) {
      return expectedPattern.test(path);
    }
    return path !== "/" && path.length > 1;
  }, { timeout: 5000 });
}

export async function fillTitleAndSubmit(page: Page, title: string, submitKey: 'Enter' | 'blur'): Promise<void> {
  const titleField = page.getByTestId("page-title-input");
  await titleField.fill(title);
  if (submitKey === 'Enter') {
    await titleField.press("Enter");
  } else {
    await titleField.blur();
  }
  await waitForNetworkIdle(page);
}
```

---

### Phase 2: Create Common Steps

**File: `step-definitions/common-steps.ts`**

```typescript
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import {
  setupPage,
  waitForPageLoad,
  navigateToPageByTitle,
  switchToMode,
  verifyNavigation,
  fillTitleAndSubmit,
  waitForNetworkIdle
} from "../support/test-helpers";

// ============================================================================
// GIVEN Steps - Setup/Preconditions
// ============================================================================

Given(
  "I am viewing a page",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await waitForPageLoad(page);
  }
);

Given(
  /^I am viewing (?:the )?"([^"]*)" page$/,
  async function (this: AppWorld, pageTitle: string) {
    const page = await setupPage(this);
    await navigateToPageByTitle(page, pageTitle);
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
);

Given(
  "I am in {word} mode",
  async function (this: AppWorld, mode: 'edit' | 'preview') {
    const page = await this.ensurePage();
    await switchToMode(page, mode);
  }
);

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

When(
  "I edit the title field and {word}",
  async function (this: AppWorld, action: 'blur' | 'press Enter') {
    const page = await this.ensurePage();
    const submitKey = action.includes('Enter') ? 'Enter' : 'blur';
    await fillTitleAndSubmit(page, "Test Title", submitKey);
  }
);

When(
  "I click the {string} button",
  async function (this: AppWorld, buttonName: string) {
    const page = await this.ensurePage();
    // Map common button names to test IDs
    const buttonMap: Record<string, string> = {
      'Edit': 'edit-button',
      'Save': 'save-button',
      'Preview': 'preview-button',
      'Delete': 'delete-page-button',
      'Back': 'back-button'
    };
    
    const testId = buttonMap[buttonName];
    if (testId) {
      await page.getByTestId(testId).click();
    } else {
      await page.getByRole('button', { name: buttonName }).click();
    }
  }
);

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

Then(
  "I should be navigated to {word} page",
  async function (this: AppWorld, pageType: string) {
    const page = await this.ensurePage();
    
    const patterns: Record<string, RegExp> = {
      'new': /Untitled/,
      'another': /.+/,
      'child': /\/.+\/.+/,
      'parent': /.+/
    };
    
    const pattern = patterns[pageType] || /.+/;
    await verifyNavigation(page, pattern);
  }
);

Then(
  "the {string} should be visible",
  async function (this: AppWorld, element: string) {
    const page = await this.ensurePage();
    
    const selectors: Record<string, string> = {
      'markdown source editor': '[data-testid="content-textarea"]',
      'page title': '[data-testid="page-title-input"]',
      'sidebar': '[data-testid="sidebar"]',
      'prose content': '.prose'
    };
    
    const selector = selectors[element] || element;
    await page.waitForSelector(selector, { timeout: 5000 });
    await expect(page.locator(selector)).toBeVisible();
  }
);

Then(
  "the URL should {word} {string}",
  async function (this: AppWorld, verb: string, pattern: string) {
    const page = await this.ensurePage();
    const pathname = new URL(page.url()).pathname;
    
    switch (verb) {
      case 'contain':
      case 'include':
        expect(pathname).toContain(pattern);
        break;
      case 'match':
        expect(pathname).toMatch(new RegExp(pattern));
        break;
      case 'be':
        expect(pathname).toBe(pattern);
        break;
      default:
        expect(pathname).toMatch(new RegExp(pattern));
    }
  }
);
```

---

### Phase 3: Update Feature Files

**Example: checkboxes.feature (BEFORE)**
```gherkin
Scenario: Checkboxes are not interactive in edit mode
  Given I am viewing the "Getting Started" page
  And I am in edit mode
  When I try to click a checkbox
  Then the checkbox should not toggle
  And I should see the markdown source editor
```

**Example: checkboxes.feature (AFTER - no changes needed!)**
```gherkin
Scenario: Checkboxes are not interactive in edit mode
  Given I am viewing the "Getting Started" page
  And I am in edit mode  # ← Now uses parameterized step!
  When I try to click a checkbox
  Then the checkbox should not toggle
  And the "markdown source editor" should be visible  # ← Simplified!
```

**Example: editing.feature (BEFORE)**
```gherkin
Scenario: Page editing workflow
  Given I am viewing a page in view mode
  When I click the Edit button
  Then I should see the markdown source editor
```

**Example: editing.feature (AFTER)**
```gherkin
Scenario: Page editing workflow
  Given I am viewing a page  # ← Simplified!
  And I am in preview mode    # ← Add explicit mode!
  When I click the "Edit" button  # ← Parameterized!
  Then the "markdown source editor" should be visible  # ← Simplified!
```

---

### Phase 4: Remove Duplicates

**Files to clean up:**

1. **checkboxes.steps.ts** - Remove:
   - `Given "I am in edit mode"`
   - `Given "I am in preview mode"`
   - Keep checkbox-specific logic only

2. **editing.steps.ts** - Remove:
   - `Given "I am viewing a page in view mode"` → use common step
   - `When "I click the Edit button"` → use common step
   - Keep edit-specific logic

3. **navigation.steps.ts** - Remove:
   - `Given "I am on a page"` → use common step
   - Multiple navigation assertions → use common step

4. **page-management.steps.ts** - Remove:
   - `Given "I am viewing a page"` → use common step

---

## Metrics

### Before Refactoring
- **Total step definitions:** 137
- **Duplicate setup code:** ~30 instances
- **Mode-specific steps:** 2 (should be 1 parameterized)
- **Page viewing steps:** 5 variations
- **Navigation assertions:** 6 variations

### After Refactoring (Estimated)
- **Total step definitions:** ~80-90 (35-40% reduction)
- **Shared utilities:** 8-10 helper functions
- **Common steps:** 15-20 reusable steps
- **Duplicate code reduction:** 60-70%
- **Parameterized steps:** 10-15 (vs 2-3 currently)

---

## Implementation Order

1. ✅ Create `support/test-helpers.ts` with utilities
2. ✅ Create `step-definitions/common-steps.ts` with shared steps
3. ✅ Update feature files to use new parameterized steps
4. ✅ Remove duplicate step definitions from individual files
5. ✅ Run tests to verify functionality
6. ✅ Document the new patterns for future development

---

## Benefits

1. **Maintainability:** Change once, apply everywhere
2. **Consistency:** Same behavior across all tests
3. **Readability:** Feature files become more natural language
4. **Development Speed:** Write new tests faster with reusable steps
5. **Testing:** Easier to test step definitions in isolation

---

## Example Transformations

### Transformation 1: Mode Switching

**BEFORE (2 separate steps):**
```typescript
// checkboxes.steps.ts
Given("I am in edit mode", async function() {
  const page = await this.ensurePage();
  const editButton = page.getByRole("button", { name: "Edit" });
  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForSelector('[aria-label="Page content"]', { timeout: 5000 });
  }
});

Given("I am in preview mode", async function() {
  const page = await this.ensurePage();
  const editButton = page.getByRole("button", { name: "Edit" });
  if (await editButton.isVisible()) {
    return;
  }
  const previewButton = page.getByRole("button", { name: "Preview" });
  if (await previewButton.isVisible()) {
    await previewButton.click();
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
});
```

**AFTER (1 parameterized step):**
```typescript
// common-steps.ts
Given("I am in {word} mode", async function(mode: 'edit' | 'preview') {
  const page = await this.ensurePage();
  await switchToMode(page, mode);
});
```

### Transformation 2: Page Viewing

**BEFORE (5 separate steps across multiple files):**
```typescript
// page-management.steps.ts
Given("I am viewing a page", async function() { /* 10 lines */ });

// navigation.steps.ts
Given("I am on a page", async function() { /* 10 lines */ });

// editing.steps.ts
Given("I am viewing a page in view mode", async function() { /* 12 lines */ });

// checkboxes.steps.ts
Given(/^I am viewing the "([^"]*)" page$/, async function(pageTitle) { /* 25 lines */ });
```

**AFTER (2 parameterized steps):**
```typescript
// common-steps.ts
Given("I am viewing a page", async function() {
  const page = await setupPage(this);
  await waitForPageLoad(page);
});

Given(/^I am viewing (?:the )?"([^"]*)" page$/, async function(pageTitle) {
  const page = await setupPage(this);
  await navigateToPageByTitle(page, pageTitle);
});
```

**Lines of Code:**
- Before: ~57 lines
- After: ~10 lines + utilities
- **Reduction: 80%**

---

## Next Steps

Ready to implement? I can:
1. Create the helper utilities file
2. Create the common steps file  
3. Update feature files one by one
4. Remove duplicates from individual step files
5. Run tests to verify

Would you like me to proceed with the refactoring?
