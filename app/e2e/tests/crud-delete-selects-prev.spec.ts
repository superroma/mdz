import { test, expect } from '@playwright/test'

async function create(page: any, path: string, content = '') {
  const res = await page.request.post('/api/pages', {
    data: { path, content },
  })
  expect(res.ok()).toBeTruthy()
}

async function del(page: any, path: string) {
  const res = await page.request.delete(
    `/api/pages/${encodeURIComponent(path)}`,
  )
  // ignore status; best-effort cleanup
}

async function cleanAll(page: any) {
  const treeRes = await page.request.get('/api/pages')
  const tree = (await treeRes.json()) as Array<{
    path: string
    children?: any[]
  }>
  const stack: string[] = []
  function pushAll(nodes: any[]) {
    for (const n of nodes) {
      stack.push(n.path)
      if (n.children && n.children.length) pushAll(n.children)
    }
  }
  pushAll(tree)
  for (const p of stack)
    await page.request.delete(`/api/pages/${encodeURIComponent(p)}`)
}

test.describe('Delete selection behavior', () => {
  test.beforeEach(async ({ page }) => {
    await cleanAll(page)
    // Create three ordered pages
    await create(page, '1-First', '# First')
    await create(page, '2-Second', '# Second')
    await create(page, '3-Third', '# Third')
  })

  test('deleting last page selects previous', async ({ page }) => {
    try {
      await page.goto('/p/3-Third')
      await page.getByRole('button', { name: /delete/i }).click()
      await expect(page).toHaveURL(/\/p\/2-Second$/)
    } finally {
      await del(page, '1-First')
      await del(page, '2-Second')
    }
  })
})
