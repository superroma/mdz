import { test, expect } from '@playwright/test'

test.describe('Mobile UI', () => {
  test('sidebar toggle and add root page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const sidebar = page.getByRole('navigation', { name: /pages/i })
    await expect(sidebar).toBeHidden()

    const toggle = page.getByRole('button', { name: /open sidebar/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(sidebar).toBeVisible()

    const addRoot = page.getByRole('button', { name: /add root page/i })
    await addRoot.click()

    await expect(page).toHaveURL(/\/p\//)
    const navAgain = page.getByRole('navigation', { name: /pages/i })
    await expect(navAgain).toBeVisible()
  })
})
