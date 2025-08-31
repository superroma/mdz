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
import './index.css'
import { Sidebar } from './sidebar'
import { usePagesStore } from './store/pages.store'
import { flattenTreePreOrder } from './tree'
import { PageView } from './page-view'

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

// PageView moved to ./page-view

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
