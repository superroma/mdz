import { test, expect } from '@playwright/test'
import { cleanAll, create } from './_helpers'

test('startup selects first page when none selected', async ({ page }) => {
  await cleanAll(page)
  await create(page, 'Z-First', '# First')

  await page.goto('/')
  await expect(page).toHaveURL(/\/p\/Z-First$/)
})
