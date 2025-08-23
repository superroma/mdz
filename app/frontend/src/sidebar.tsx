import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePagesStore } from './store/pages.store'

type Node = { path: string; title: string; children?: Node[] }

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = React.useState(false)

  const tree = usePagesStore((s) => s.tree)
  const loadTree = usePagesStore((s) => s.loadTree)
  const createRootUntitled = usePagesStore((s) => s.createRootUntitled)
  const createChildUntitled = usePagesStore((s) => s.createChildUntitled)

  const currentPagePath = React.useMemo(() => {
    const match = location.pathname.match(/^\/p\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }, [location.pathname])

  React.useEffect(() => {
    void loadTree()
  }, [loadTree])

  async function addRoot() {
    const path = await createRootUntitled()
    await loadTree()
    navigate(`/p/${encodeURIComponent(path)}`)
  }

  async function addChild(parentPath: string) {
    const path = await createChildUntitled(parentPath)
    await loadTree()
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
              node={n as any as Node}
              selectedPath={currentPagePath}
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
  selectedPath,
  onOpen,
  onAddChild,
}: {
  node: Node
  selectedPath?: string | null
  onOpen: (p: string) => void
  onAddChild: (p: string) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isSelected = selectedPath === node.path
  return (
    <li role="treeitem" aria-expanded={hasChildren ? true : undefined}>
      <div
        className={`flex items-center gap-2 w-full justify-between rounded px-1 py-0.5 transition-colors ${
          isSelected
            ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-700'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <button
          aria-label={`open ${node.title}`}
          className={
            'text-left hover:underline px-2 py-1 rounded bg-transparent flex-1 min-w-0'
          }
          onClick={() => onOpen(node.path)}
        >
          {node.title}
        </button>
        <button
          aria-label={`add child page for ${node.title}`}
          className="ml-2 px-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
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
              selectedPath={selectedPath}
              onOpen={onOpen}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
