import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { usePagesStore } from './pages.store'

const treeFixture = [
  { path: 'A', title: 'A', children: [] },
  {
    path: 'B',
    title: 'B',
    children: [{ path: 'B/C', title: 'C', children: [] }],
  },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('loadTree sets tree from api', async () => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => treeFixture,
  } as any)
  const loadTree = usePagesStore.getState().loadTree
  await loadTree()
  expect(usePagesStore.getState().tree).toEqual(treeFixture)
})

test('createRootUntitled returns created path and refreshes tree', async () => {
  const calls: string[] = []
  vi.spyOn(global, 'fetch' as any).mockImplementation(
    async (url: string, init?: any) => {
      const u = String(url)
      calls.push(u + ' ' + (init?.method || 'GET'))
      if (u.endsWith('/api/pages') && init?.method === 'POST') {
        return { ok: true, json: async () => ({ success: true }) } as any
      }
      if (u.endsWith('/api/pages') && !init) {
        return { ok: true, json: async () => treeFixture } as any
      }
      return { ok: true, json: async () => ({}) } as any
    },
  )
  const path = await usePagesStore.getState().createRootUntitled()
  expect(path).toMatch(/^Untitled/)
  // ensure we attempted to refresh tree
  expect(calls.some((c) => c.startsWith('/api/pages GET'))).toBe(true)
})

test('renamePath calls api and refreshes tree', async () => {
  const calls: string[] = []
  vi.spyOn(global, 'fetch' as any).mockImplementation(
    async (url: string, init?: any) => {
      const u = String(url)
      calls.push(u + ' ' + (init?.method || 'GET'))
      if (/\/api\/pages\//.test(u) && init?.method === 'PUT') {
        return { ok: true, json: async () => ({ success: true }) } as any
      }
      if (u.endsWith('/api/pages') && !init) {
        return { ok: true, json: async () => treeFixture } as any
      }
      return { ok: true, json: async () => ({}) } as any
    },
  )
  await usePagesStore.getState().renamePath('A', 'A2')
  expect(calls.some((c) => /\/api\/pages\/.+ PUT/.test(c))).toBe(true)
  expect(calls.some((c) => c.startsWith('/api/pages GET'))).toBe(true)
})

test('deletePath calls api and refreshes tree', async () => {
  const calls: string[] = []
  vi.spyOn(global, 'fetch' as any).mockImplementation(
    async (url: string, init?: any) => {
      const u = String(url)
      calls.push(u + ' ' + (init?.method || 'GET'))
      if (/\/api\/pages\//.test(u) && init?.method === 'DELETE') {
        return { ok: true, json: async () => ({ success: true }) } as any
      }
      if (u.endsWith('/api/pages') && !init) {
        return { ok: true, json: async () => treeFixture } as any
      }
      return { ok: true, json: async () => ({}) } as any
    },
  )
  await usePagesStore.getState().deletePath('A')
  expect(calls.some((c) => /\/api\/pages\/.+ DELETE/.test(c))).toBe(true)
  expect(calls.some((c) => c.startsWith('/api/pages GET'))).toBe(true)
})
