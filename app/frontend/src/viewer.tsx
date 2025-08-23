import React from 'react'
import { api } from './api'
import { MDXProvider } from '@mdx-js/react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

export function Viewer({ path }: { path: string }) {
  const [content, setContent] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  React.useEffect(() => {
    api
      .page(path)
      .then((p) => setContent(p.content))
      .catch((e) => setError(String(e?.message || e)))
  }, [path])

  if (error) return <div role="alert">{error}</div>
  return (
    <div className="p-4 mdx-content">
      <MDXRuntime code={content} />
    </div>
  )
}

function MDXRuntime({ code }: { code: string }) {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const file = await evaluate(code, {
          ...runtime,
          useDynamicImport: false,
        })
        const C = (file as any).default as React.ComponentType | undefined
        if (!cancelled) setComp(() => (C ? C : () => null))
      } catch (e) {
        if (!cancelled) setComp(() => () => null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code])
  if (!Comp) return null
  return (
    <MDXProvider>
      <Comp />
    </MDXProvider>
  )
}
