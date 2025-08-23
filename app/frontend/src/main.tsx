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
import { Viewer } from './viewer'
import { Editor } from './editor'
import './index.css'
import { api } from './api'
import { Sidebar } from './sidebar'
import { usePagesStore } from './store/pages.store'

function App() {
  React.useEffect(() => {
    const mode = (import.meta as any).env?.VITE_THEME || 'system'
    const root = document.documentElement
    if (mode === 'dark') root.style.colorScheme = 'dark'
    else if (mode === 'light') root.style.colorScheme = 'light'
    else root.style.colorScheme = 'light dark'
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
            await api.remove(decodeURIComponent(path))
            navigate('/')
          }}
        >
          Delete
        </button>
      </div>
      {mode === 'view' ? (
        <Viewer path={decodeURIComponent(path)} />
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
