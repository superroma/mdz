import React from 'react'
import { MDXProvider } from '@mdx-js/react'
import { evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import * as runtime from 'react/jsx-runtime'
// Do not use jsx-dev runtime; compile to production jsx/jsxs for stability
// Fallback pipeline removed per MDX+GFM requirement

export function Viewer({ source }: { source: string }) {
  return (
    <div className="p-4 mdx-content">
      <MDXRuntime code={source} />
    </div>
  )
}

// Fetches page content by path and renders via Viewer
export function PageViewer({ path }: { path: string }) {
  const [content, setContent] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    let cancelled = false
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/pages/${encodeURIComponent(path)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const j = (await res.json()) as { content?: string }
        if (!cancelled) setContent(String(j?.content ?? ''))
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [path])
  if (error) return <pre role="alert">{error}</pre>
  return <Viewer source={content} />
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { error }
  }
  render() {
    if (this.state.error) {
      const msg = String(this.state.error?.message || this.state.error)
      return (
        <pre role="alert" style={{ whiteSpace: 'pre-wrap' }}>
          {msg}
        </pre>
      )
    }
    return this.props.children as any
  }
}

function MDXRuntime({ code }: { code: string }) {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const preprocessed = code.replace(
          /<(https?:\/\/[^>\s]+)>/g,
          (_m, url) => `[${url}](${url})`,
        )
        const file = await evaluate(preprocessed, {
          Fragment: runtime.Fragment as any,
          jsx: (runtime as any).jsx,
          jsxs: (runtime as any).jsxs,
          useDynamicImport: false,
          remarkPlugins: [remarkGfm],
          providerImportSource: '@mdx-js/react',
          development: false,
          outputFormat: 'function-body',
        } as any)
        const C = (file as any).default as React.ComponentType | undefined
        if (!cancelled) {
          if (!C) {
            setErr('MDX produced no default export')
            setComp(() => null)
          } else {
            setErr(null)
            setComp(() => C)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setErr(String((e as any)?.message || e))
          setComp(() => () => null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code])
  React.useEffect(() => {
    if (!Comp || err) return
    // Defer to after paint to check if anything actually rendered
    const id = window.setTimeout(() => {
      const html = containerRef.current?.innerHTML?.trim() || ''
      if (!html) setErr('MDX rendered no content')
    }, 0)
    return () => window.clearTimeout(id)
  }, [Comp, err, code])
  if (err) return <pre role="alert">{err}</pre>
  if (!Comp) return null
  return (
    <MDXProvider>
      <ErrorBoundary>
        <div ref={containerRef}>
          <Comp />
        </div>
      </ErrorBoundary>
    </MDXProvider>
  )
}
