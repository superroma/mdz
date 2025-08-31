import { test, expect } from '@playwright/test'
import { cleanAll, create } from './_helpers'

test('renders page content in view mode', async ({ page }) => {
  await cleanAll(page)
  await create(page, 'ContentTest', '# Hello E2E')

  // Act: open viewer route
  await page.goto('/p/ContentTest')

  // Assert: heading is shown
  await expect(page.getByRole('heading', { name: 'Hello E2E' })).toBeVisible()
})
