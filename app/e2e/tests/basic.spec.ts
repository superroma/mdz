import { test, expect } from '@playwright/test'

test('loads app and shows sidebar', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: /pages/i })
  if ((await nav.count()) === 0) {
    const toggle = page.getByRole('button', { name: /open sidebar/i })
    if (await toggle.isVisible()) {
      await toggle.click()
    }
  }
  await expect(nav).toBeVisible()
})
