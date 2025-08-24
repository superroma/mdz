import { test, expect } from '@playwright/test'

test('renders page content in view mode', async ({ page }) => {
  // Arrange: create a page
  const res = await page.request.post('/api/pages', {
    data: { path: 'ContentTest', content: '# Hello E2E' },
  })
  expect(res.ok()).toBeTruthy()

  // Act: open viewer route
  await page.goto('/p/ContentTest')
  await page.getByRole('button', { name: 'view' }).click()

  // Assert: heading is shown
  await expect(page.getByRole('heading', { name: 'Hello E2E' })).toBeVisible()
})
