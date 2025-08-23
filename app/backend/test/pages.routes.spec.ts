import { expect, test, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildServer } from '../src/server'

let rootDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'mdz-api-'))
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

test('GET /pages returns tree, CRUD works', async () => {
  const server = buildServer({ storageRoot: rootDir })

  // Initially empty
  const treeRes1 = await server.inject({ method: 'GET', url: '/pages' })
  expect(treeRes1.statusCode).toBe(200)
  expect(treeRes1.json()).toEqual([])

  // Create a page
  const createRes = await server.inject({
    method: 'POST',
    url: '/pages',
    payload: { path: 'Welcome', content: '# Hi' },
  })
  expect(createRes.statusCode).toBe(201)

  // Get page
  const pageRes = await server.inject({ method: 'GET', url: '/pages/Welcome' })
  expect(pageRes.statusCode).toBe(200)
  expect(pageRes.json()).toMatchObject({ path: 'Welcome', title: 'Welcome' })

  // Update
  const updateRes = await server.inject({
    method: 'PUT',
    url: '/pages/Welcome',
    payload: { content: '# Updated' },
  })
  expect(updateRes.statusCode).toBe(200)

  // Rename under same parent
  const renameRes = await server.inject({
    method: 'PUT',
    url: '/pages/Welcome',
    payload: { newName: 'Start' },
  })
  expect(renameRes.statusCode).toBe(200)
  // Guard: cannot rename and update content simultaneously
  const badRename = await server.inject({
    method: 'PUT',
    url: '/pages/Start',
    payload: { newName: 'X', content: 'y' },
  })
  expect(badRename.statusCode).toBe(400)

  const pageRes2 = await server.inject({ method: 'GET', url: '/pages/Start' })
  expect(pageRes2.statusCode).toBe(200)
  expect(pageRes2.json().title).toBe('Start')

  // Delete
  const delRes = await server.inject({ method: 'DELETE', url: '/pages/Start' })
  expect(delRes.statusCode).toBe(200)
  const missing = await server.inject({ method: 'GET', url: '/pages/Start' })
  expect(missing.statusCode).toBe(404)
})
