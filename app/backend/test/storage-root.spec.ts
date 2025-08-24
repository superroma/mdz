import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

describe('STORAGE_ROOT validation', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterEach(() => {
    process.env = OLD_ENV
  })

  test('fails fast when STORAGE_ROOT does not exist', async () => {
    process.env.STORAGE_ROOT = path.resolve(__dirname, 'definitely-missing-dir')
    const mod = await import('../src/server')
    expect(() => mod.buildServer()).toThrow(/Invalid STORAGE_ROOT/i)
  })
})
