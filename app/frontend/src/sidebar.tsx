import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api'

type Node = { path: string; title: string; children?: Node[] }

export function Sidebar() {
  const [tree, setTree] = React.useState<Node[]>([])
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  async function refreshTree() {
    const t = await api.tree()
    setTree(t)
  }

  React.useEffect(() => {
    void refreshTree()
  }, [])

  async function generateAvailableName(base: string, parentPath?: string) {
    for (let i = 0; i < 20; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`
      const full = parentPath ? `${parentPath}/${candidate}` : candidate
      try {
        await api.create(full, '')
        return full
      } catch (e: any) {
        const msg = String(e?.message || e)
        if (!/already exists/i.test(msg)) throw e
      }
    }
    throw new Error('Could not allocate a unique name')
  }

  async function addRoot() {
    const path = await generateAvailableName('Untitled')
    await refreshTree()
    navigate(`/p/${encodeURIComponent(path)}`)
  }

  async function addChild(parentPath: string) {
    const path = await generateAvailableName('Untitled', parentPath)
    await refreshTree()
    navigate(`/p/${encodeURIComponent(path)}`)
  }

  return (
    <aside className="md:w-[280px] md:shrink-0">
      <button
        aria-label={open ? 'close sidebar' : 'open sidebar'}
        className="md:hidden m-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      <nav
        aria-label="Pages"
        className={`border-r border-gray-200 p-2 overflow-auto h-full ${
          open ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="flex items-center justify-between px-1 pb-2">
          <div className="font-semibold text-sm text-gray-700">Pages</div>
          <button
            aria-label="add root page"
            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
            onClick={() => void addRoot()}
          >
            +
          </button>
        </div>
        <ul role="tree" className="space-y-1">
          {tree.map((n) => (
            <TreeNode
              key={n.path}
              node={n}
              onOpen={(p) => navigate(`/p/${encodeURIComponent(p)}`)}
              onAddChild={(p) => void addChild(p)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function TreeNode({
  node,
  onOpen,
  onAddChild,
}: {
  node: Node
  onOpen: (p: string) => void
  onAddChild: (p: string) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  return (
    <li role="treeitem" aria-expanded={hasChildren ? true : undefined}>
      <div className="flex items-center gap-2">
        <button
          aria-label={`open ${node.title}`}
          className="text-left hover:underline"
          onClick={() => onOpen(node.path)}
        >
          {node.title}
        </button>
        <button
          aria-label={`add child page for ${node.title}`}
          className="px-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
          onClick={() => onAddChild(node.path)}
        >
          +
        </button>
      </div>
      {hasChildren && (
        <ul role="group" className="ml-4 mt-1 space-y-1">
          {node.children!.map((c) => (
            <TreeNode
              key={c.path}
              node={c}
              onOpen={onOpen}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
