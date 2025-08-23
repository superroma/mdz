import { expect, test, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from '../src/storage'

let rootDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'mdz-test-'))
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

test('ensureStorageRoot creates root dir', async () => {
  const storage = createStorage(rootDir)
  await expect(storage.ensureStorageRoot()).resolves.toBeUndefined()
})

test('create/get/update/delete page lifecycle', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()

  await expect(
    storage.createPage({ path: 'Welcome', content: '# Hello' }),
  ).resolves.toBeUndefined()

  const page1 = await storage.getPage('Welcome')
  expect(page1.path).toBe('Welcome')
  expect(page1.title).toBe('Welcome')
  expect(page1.content).toContain('# Hello')

  await expect(
    storage.updatePage('Welcome', { content: '# Updated' }),
  ).resolves.toBeUndefined()

  const page2 = await storage.getPage('Welcome')
  expect(page2.content).toContain('# Updated')

  await expect(storage.deletePage('Welcome')).resolves.toBeUndefined()
  await expect(storage.getPage('Welcome')).rejects.toThrow(/not found/i)
})

test('rename page within parent directory', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()
  await storage.createPage({ path: 'docs/Intro', content: 'text' })

  await expect(
    storage.renamePage('docs/Intro', 'Start'),
  ).resolves.toBeUndefined()

  await expect(storage.getPage('docs/Intro')).rejects.toThrow(/not found/i)
  const page = await storage.getPage('docs/Start')
  expect(page.title).toBe('Start')
  expect(page.content).toContain('text')
})

test('getPageTree returns nested structure', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()
  await storage.createPage({ path: 'Welcome', content: '' })
  await storage.createPage({ path: 'guides/Setup', content: '' })
  await storage.createPage({ path: 'guides/Advanced', content: '' })

  const tree = await storage.getPageTree()

  // Root has Welcome and guides
  const rootTitles = tree.map((n) => n.title).sort()
  expect(rootTitles).toEqual(['Welcome', 'guides'])

  const guides = tree.find((n) => n.path === 'guides')!
  const childTitles = guides.children.map((n) => n.title).sort()
  expect(childTitles).toEqual(['Advanced', 'Setup'])
})
