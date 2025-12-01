import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import { ensureServersRunning } from "../support/server-manager";
import { FRONTEND_URL } from "../support/constants";

Given(
  "I have a page with all known problematic markdown patterns",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    
    await page.getByRole("button", { name: "Edit page content" }).click();
    const editor = page.getByRole("textbox", { name: "Page content" });
    
    const problematicContent = `# Markdown Resilience Test

This page contains all known problematic markdown patterns that should never crash the app.

## 1. HTML with inline styles (React JSX incompatible)

<div style="color:red">Red text with inline style</div>

<span style="background-color:yellow;padding:10px">Yellow background</span>

<p style="font-size:20px;margin:5px">Large text</p>

## 2. HTML with complex attributes

<div class="test" id="myid" data-value="123">Complex HTML</div>

<table style="border:1px solid black">
  <tr><td style="padding:5px">Cell</td></tr>
</table>

## 3. Nested HTML

<div style="color:blue">
  <span style="font-weight:bold">Nested</span>
  <div style="margin:10px">Deep nesting</div>
</div>

## 4. Mixed markdown and HTML

**Bold** <span style="color:red">red</span> *italic*

## 5. Cyrillic and Unicode

Текст на русском языке с **жирным** и *курсивом*

中文字符 日本語 العربية 

## 6. Special characters in code blocks

\`\`\`javascript
const obj = { key: "value", style: "color:red" };
\`\`\`

## 7. Tables with special characters

| Имя | Значение |
|-----|----------|
| тест | 123 |
| данные | <div>HTML</div> |

## 8. Links with special characters

[Русская ссылка](./Другая%20страница)

## 9. Images with styles (should not crash)

<img src="test.png" style="width:100px" />

## 10. Multiple problematic patterns together

<div style="color:red"><strong>Bold</strong> and <em>italic</em> with ~~strikethrough~~</div>

Regular markdown continues here...`;
    
    await editor.fill(problematicContent);
    await editor.press("Meta+s");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    await page.getByRole("button", { name: "Preview page content" }).click();
    await page.waitForTimeout(500);
  }
);

Then(
  "the application should not crash",
  { timeout: 15000 },
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeVisible({ timeout: 10000 });
  }
);

Then(
  "the page should be navigable",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
    await expect(sidebar).toBeVisible();
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    await expect(editButton).toBeVisible();
  }
);

Then(
  "I should be able to interact with the UI",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeEnabled();
    
    const isEditable = await titleInput.isEditable();
    expect(isEditable).toBe(true);
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    const isClickable = await editButton.isEnabled();
    expect(isClickable).toBe(true);
  }
);
