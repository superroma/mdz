import { expect, test, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from '../src/storage'

let rootDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'mdz1-fold-'))
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

test('creating first child converts single Page.md to Page/README.md', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()

  await storage.createPage({ path: 'Welcome', content: 'parent' })
  // single exists
  expect(existsSync(join(rootDir, 'Welcome.md'))).toBe(true)

  // create child triggers conversion
  await storage.createPage({ path: 'Welcome/Tips', content: 'child' })

  // single removed, folder created
  expect(existsSync(join(rootDir, 'Welcome.md'))).toBe(false)
  expect(existsSync(join(rootDir, 'Welcome', 'README.md'))).toBe(true)
  expect(existsSync(join(rootDir, 'Welcome', 'Tips.md'))).toBe(true)

  const parent = await storage.getPage('Welcome')
  expect(parent.content).toBe('parent')
  const child = await storage.getPage('Welcome/Tips')
  expect(child.content).toBe('child')
})

test('deleting last child converts Page/README.md back to Page.md', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()

  await storage.createPage({ path: 'Docs', content: 'root' })
  await storage.createPage({ path: 'Docs/Intro', content: 'intro' })

  expect(existsSync(join(rootDir, 'Docs', 'README.md'))).toBe(true)
  expect(existsSync(join(rootDir, 'Docs', 'Intro.md'))).toBe(true)

  await storage.deletePage('Docs/Intro')

  // converted back
  expect(existsSync(join(rootDir, 'Docs.md'))).toBe(true)
  expect(existsSync(join(rootDir, 'Docs'))).toBe(false)

  const parent = await storage.getPage('Docs')
  expect(parent.content).toBe('root')
})

test('tree lists parents and children correctly', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()

  await storage.createPage({ path: 'Welcome', content: '' })
  await storage.createPage({ path: 'Welcome/Tips', content: '' })
  await storage.createPage({ path: 'Other', content: '' })

  const tree = await storage.getPageTree()
  const names = tree.map((n) => n.title).sort()
  expect(names).toEqual(['Other', 'Welcome'])
  const welcome = tree.find((n) => n.path === 'Welcome')!
  const childNames = welcome.children.map((c) => c.title).sort()
  expect(childNames).toEqual(['Tips'])
})

test('deeply nested create converts intermediate parents to folders', async () => {
  const storage = createStorage(rootDir)
  await storage.ensureStorageRoot()

  await storage.createPage({ path: 'level1', content: 'l1' })
  await storage.createPage({ path: 'level1/level2', content: 'l2' })
  await storage.createPage({ path: 'level1/level2/level3', content: 'l3' })

  // level1 and level2 should be folders now
  expect(existsSync(join(rootDir, 'level1', 'README.md'))).toBe(true)
  expect(existsSync(join(rootDir, 'level1', 'level2', 'README.md'))).toBe(true)
  expect(existsSync(join(rootDir, 'level1', 'level2', 'level3.md'))).toBe(true)

  const p3 = await storage.getPage('level1/level2/level3')
  expect(p3.content).toBe('l3')
})
