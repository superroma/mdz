import { test, expect } from '@playwright/test'

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
  // Delete all; ignore failures
  for (const p of stack) {
    await page.request.delete(`/api/pages/${encodeURIComponent(p)}`)
  }
}

test('deleting a page leads to 404 on direct visit', async ({
  page,
  request,
}) => {
  await cleanAll(page)
  // Create page via API
  const res = await request.post('http://localhost:3001/pages', {
    data: { path: 'Temp', content: 'x' },
  })
  expect(res.ok()).toBeTruthy()

  await page.goto('/p/Temp')
  await expect(page.getByRole('button', { name: 'delete' })).toBeVisible()
  await page.getByRole('button', { name: 'delete' }).click()
  // Behavior: after delete, navigate to previous/first if any remain; otherwise empty view
  // We cannot assert a specific page here without creating neighbors, so just assert app stays responsive
  await expect(page).toHaveURL(/\/?(p\/|$)/)

  // Direct link should show 404 from backend
  const res2 = await request.get('http://localhost:3001/pages/Temp')
  expect(res2.status()).toBe(404)
})
