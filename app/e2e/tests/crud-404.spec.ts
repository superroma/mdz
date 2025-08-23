import { test, expect } from "@playwright/test";

test("deleting a page leads to 404 on direct visit", async ({
  page,
  request,
}) => {
  // Create page via API
  const res = await request.post("http://localhost:3001/pages", {
    data: { path: "Temp", content: "x" },
  });
  expect(res.ok()).toBeTruthy();

  await page.goto("/p/Temp");
  await expect(page.getByRole("button", { name: "delete" })).toBeVisible();
  await page.getByRole("button", { name: "delete" }).click();
  await expect(page.getByLabel("empty")).toBeVisible();

  // Direct link should show 404 from backend
  const res2 = await request.get("http://localhost:3001/pages/Temp");
  expect(res2.status()).toBe(404);
});
