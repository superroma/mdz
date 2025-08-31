export async function cleanAll(page: any) {
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

export async function create(page: any, path: string, content = '') {
  const res = await page.request.post('/api/pages', { data: { path, content } })
  if (!res.ok()) throw new Error(`Failed to create page ${path}`)
}
