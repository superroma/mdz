import { FullConfig } from '@playwright/test'
import { rmSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export default async function globalSetup(_config: FullConfig) {
  const root = resolve(__dirname, '../../e2e/test-pages')
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })
}
