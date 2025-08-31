import { test, expect } from '@playwright/test'

test('startup selects first page when none selected', async ({ page }) => {
  // Ensure there is at least one page
  const res = await page.request.post('/api/pages', {
    data: { path: 'Z-First', content: '# First' },
  })
  expect(res.ok()).toBeTruthy()

  await page.goto('/')
  await expect(page).toHaveURL(/\/p\/Z-First$/)
})




