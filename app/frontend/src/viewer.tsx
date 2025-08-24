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

function MDXRuntime({ code }: { code: string }) {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const file = await evaluate(code, {
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
          setErr(null)
          setComp(() => (C ? C : () => null))
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
  if (!Comp) return err ? <pre role="alert">{err}</pre> : null
  return (
    <MDXProvider>
      <Comp />
    </MDXProvider>
  )
}
