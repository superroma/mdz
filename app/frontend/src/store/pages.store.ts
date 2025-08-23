import { create } from 'zustand'
import { api } from '../api'

export type PageNode = { path: string; title: string; children?: PageNode[] }

type PagesState = {
  tree: PageNode[]
  loading: boolean
  error?: string
  // actions
  loadTree: () => Promise<void>
  createRootUntitled: () => Promise<string>
  createChildUntitled: (parentPath: string) => Promise<string>
  renamePath: (oldPath: string, newName: string) => Promise<void>
  deletePath: (path: string) => Promise<void>
}

async function generateAvailableName(
  base: string,
  parentPath?: string,
): Promise<string> {
  for (let attemptIndex = 0; attemptIndex < 20; attemptIndex++) {
    const candidate = attemptIndex === 0 ? base : `${base}-${attemptIndex + 1}`
    const fullPath = parentPath ? `${parentPath}/${candidate}` : candidate
    try {
      await api.create(fullPath, '')
      return fullPath
    } catch (e: any) {
      const message = String(e?.message || e)
      if (!/already exists/i.test(message)) throw e
    }
  }
  throw new Error('Could not allocate a unique name')
}

export const usePagesStore = create<PagesState>((set) => ({
  tree: [],
  loading: false,
  error: undefined,

  async loadTree() {
    set({ loading: true, error: undefined })
    try {
      const t = await api.tree()
      set({ tree: t, loading: false })
    } catch (err: any) {
      set({ error: String(err?.message || err), loading: false })
    }
  },

  async createRootUntitled() {
    const fullPath = await generateAvailableName('Untitled')
    // refresh tree but do not await to keep UI responsive
    void (async () => {
      try {
        const t = await api.tree()
        set({ tree: t })
      } catch {}
    })()
    return fullPath
  },

  async createChildUntitled(parentPath: string) {
    const fullPath = await generateAvailableName('Untitled', parentPath)
    void (async () => {
      try {
        const t = await api.tree()
        set({ tree: t })
      } catch {}
    })()
    return fullPath
  },

  async renamePath(oldPath: string, newName: string) {
    await api.rename(oldPath, newName)
    const t = await api.tree()
    set({ tree: t })
  },

  async deletePath(path: string) {
    await api.remove(path)
    const t = await api.tree()
    set({ tree: t })
  },
}))
