import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Editor } from './editor'
import { PageViewer } from './viewer'
import { usePagesStore } from './store/pages.store'
import { flattenTreePreOrder } from './tree'

export function PageView() {
  const { path = '' } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<'view' | 'edit'>('view')
  const tree = usePagesStore((s) => s.tree)
  const deletePath = usePagesStore((s) => s.deletePath)
  const createRootUntitled = usePagesStore((s) => s.createRootUntitled)
  const renameStorePath = usePagesStore((s) => s.renamePath)
  return (
    <div>
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring clickable-surface"
          aria-label="edit"
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring clickable-surface"
          aria-label="view"
          onClick={() => setMode('view')}
        >
          View
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring clickable-surface"
          aria-label="create"
          onClick={async () => {
            const fullPath = await createRootUntitled()
            navigate(`/p/${encodeURIComponent(fullPath)}`)
          }}
        >
          New
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring clickable-surface"
          aria-label="rename"
          onClick={async () => {
            const newName = prompt('New name')
            if (newName) {
              await renameStorePath(decodeURIComponent(path), newName)
              navigate(`/p/${encodeURIComponent(newName)}`)
            }
          }}
        >
          Rename
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring clickable-surface"
          aria-label="delete"
          onClick={async () => {
            const current = decodeURIComponent(path)
            const order = flattenTreePreOrder(tree as any)
            const idx = order.indexOf(current)
            const prev = idx > 0 ? order[idx - 1] : undefined
            const nextIfFirst =
              idx === 0 && order.length > 1 ? order[1] : undefined
            const target = prev ?? nextIfFirst
            await deletePath(current)
            if (target) navigate(`/p/${encodeURIComponent(target)}`)
            else navigate('/')
          }}
        >
          Delete
        </button>
      </div>
      {mode === 'view' ? (
        <PageViewer path={decodeURIComponent(path)} />
      ) : (
        <Editor
          path={decodeURIComponent(path)}
          onSaved={() => setMode('view')}
        />
      )}
    </div>
  )
}
