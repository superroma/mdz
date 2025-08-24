import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'
import { Viewer, PageViewer } from './viewer'
import { Editor } from './editor'
import './index.css'
import { api } from './api'
import { Sidebar } from './sidebar'
import { usePagesStore } from './store/pages.store'
import { flattenTreePreOrder } from './tree'

function App() {
  React.useEffect(() => {
    const mode = (import.meta as any).env?.VITE_THEME || 'system'
    const root = document.documentElement
    const setTheme = (theme: 'light' | 'dark') => {
      root.style.colorScheme = theme
      root.setAttribute('data-theme', theme)
    }
    if (mode === 'dark') setTheme('dark')
    else if (mode === 'light') setTheme('light')
    else {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => setTheme(media.matches ? 'dark' : 'light')
      apply()
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [])

  return (
    <div className="h-screen md:flex">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/p/:path" element={<PageView />} />
          <Route
            path="*"
            element={
              <AutoSelectFirst>
                <div aria-label="empty" className="p-4 text-gray-500">
                  Select a page
                </div>
              </AutoSelectFirst>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

function AutoSelectFirst({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const tree = usePagesStore((s) => s.tree)
  const loadTree = usePagesStore((s) => s.loadTree)

  const currentPath = React.useMemo(() => {
    const match = location.pathname.match(/^\/p\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }, [location.pathname])

  React.useEffect(() => {
    // ensure tree is loaded
    if (tree.length === 0) void loadTree()
  }, [tree.length, loadTree])

  React.useEffect(() => {
    if (!currentPath && tree.length > 0) {
      navigate(`/p/${encodeURIComponent(tree[0].path)}`, { replace: true })
    }
  }, [currentPath, tree, navigate])

  return <>{children}</>
}

function PageView() {
  const { path = '' } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<'view' | 'edit'>('view')
  const tree = usePagesStore((s) => s.tree)
  const deletePath = usePagesStore((s) => s.deletePath)
  return (
    <div>
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
          aria-label="edit"
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
          aria-label="view"
          onClick={() => setMode('view')}
        >
          View
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
          aria-label="create"
          onClick={async () => {
            await api.create('Untitled', '')
            navigate('/p/Untitled')
          }}
        >
          New
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
          aria-label="rename"
          onClick={async () => {
            const newName = prompt('New name')
            if (newName) {
              await api.rename(decodeURIComponent(path), newName)
              navigate(`/p/${encodeURIComponent(newName)}`)
            }
          }}
        >
          Rename
        </button>
        <button
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring"
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

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
