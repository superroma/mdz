import { describe, it, expect } from 'vitest'
import { compile } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'

/**
 * This test follows MDX docs: compile with remarkGfm should handle tables.
 */
describe('mdx compile with gfm', () => {
  it('compiles a table to jsx-runtime calls', async () => {
    const md = `| A | B |\n| --- | --- |\n| 1 | 2 |\n`
    const out = await compile(md, { remarkPlugins: [remarkGfm] })
    const code = String(out)
    expect(code).toMatch(/_components\.table/)
    expect(code).toMatch(/_components\.th/)
    expect(code).toMatch(/_components\.td/)
  })
})
