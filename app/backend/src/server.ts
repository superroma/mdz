import Fastify from 'fastify'
import dotenv from 'dotenv'
import { createStorage } from './storage'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'

export function buildServer(opts?: { storageRoot?: string }) {
  const server = Fastify({ logger: false })

  const thisDir = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(thisDir, '../../../')
  // Load env from repo root so both dev and production runs read the same .env
  dotenv.config({ path: path.resolve(repoRoot, '.env'), override: false })
  const defaultPagesRoot = path.resolve(repoRoot, 'pages')
  const fromEnv = process.env.STORAGE_ROOT
  const candidate = opts?.storageRoot ?? fromEnv ?? defaultPagesRoot
  const storageRoot = path.isAbsolute(candidate)
    ? candidate
    : path.resolve(repoRoot, candidate)

  if (opts?.storageRoot || fromEnv) {
    try {
      const stat = fs.statSync(storageRoot)
      if (!stat.isDirectory()) throw new Error('not a directory')
    } catch {
      throw new Error(`Invalid STORAGE_ROOT: ${storageRoot} does not exist`)
    }
  }
  const storage = createStorage(storageRoot)

  server.get('/health', async () => {
    return { status: 'ok' }
  })

  if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const frontendDist = path.resolve(__dirname, '../../frontend/dist')
    server.register(
      fastifyStatic as any,
      { root: frontendDist, prefix: '/' } as any,
    )
    server.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/pages') || req.url.startsWith('/health')) {
        reply.code(404).send({ error: 'NotFound', message: 'Not found' })
      } else {
        ;(reply as any).sendFile('index.html')
      }
    })
  }

  server.get('/pages', async () => {
    return storage.getPageTree()
  })

  server.get('/pages/*', async (request, reply) => {
    const params = request.params as { '*': string }
    try {
      const page = await storage.getPage(params['*'])
      return page
    } catch (e: any) {
      return reply
        .code(404)
        .send({ error: 'NotFound', message: String(e.message ?? e) })
    }
  })

  server.post('/pages', async (request, reply) => {
    const body = request.body as any
    if (!body || typeof body.path !== 'string') {
      return reply
        .code(400)
        .send({ error: 'BadRequest', message: 'path is required' })
    }
    try {
      await storage.createPage({
        path: body.path,
        content: body.content ?? '',
      })
      return reply.code(201).send({ success: true })
    } catch (e: any) {
      const message = String(e.message ?? e)
      if (/already exists/i.test(message)) {
        return reply.code(400).send({ error: 'PageExists', message })
      }
      return reply.code(500).send({ error: 'StorageError', message })
    }
  })

  server.put('/pages/*', async (request, reply) => {
    const params = request.params as { '*': string }
    const body = request.body as {
      content?: string
      newName?: string
      metadata?: any
    }
    const path = params['*']
    if (
      typeof body.newName === 'string' &&
      (body.content !== undefined || body.metadata !== undefined)
    ) {
      return reply.code(400).send({
        error: 'BadRequest',
        message:
          'Cannot rename and update content/metadata in the same request. Use separate requests.',
      })
    }
    if (typeof body.newName === 'string' && body.newName.length > 0) {
      try {
        await storage.renamePage(path, body.newName)
        return { success: true }
      } catch (e: any) {
        const message = String(e.message ?? e)
        if (/not found/i.test(message))
          return reply.code(404).send({ error: 'NotFound', message })
        if (/already exists|path separators|Invalid path/i.test(message))
          return reply.code(400).send({ error: 'BadRequest', message })
        return reply.code(500).send({ error: 'StorageError', message })
      }
    }
    try {
      await storage.updatePage(path, {
        content: body.content,
        metadata: body.metadata,
      })
      return { success: true }
    } catch (e: any) {
      const message = String(e.message ?? e)
      if (/not found/i.test(message))
        return reply.code(404).send({ error: 'NotFound', message })
      return reply.code(500).send({ error: 'StorageError', message })
    }
  })

  server.delete('/pages/*', async (request, reply) => {
    const params = request.params as { '*': string }
    try {
      await storage.deletePage(params['*'])
      return { success: true }
    } catch (e: any) {
      const message = String(e.message ?? e)
      if (/not found/i.test(message))
        return reply.code(404).send({ error: 'NotFound', message })
      return reply.code(500).send({ error: 'StorageError', message })
    }
  })

  // Production alias under /api/pages for frontend compatibility
  if (process.env.NODE_ENV === 'production') {
    server.get('/api/pages', async () => storage.getPageTree())
    server.get('/api/pages/*', async (request, reply) => {
      const params = request.params as { '*': string }
      try {
        return await storage.getPage(params['*'])
      } catch (e: any) {
        return reply
          .code(404)
          .send({ error: 'NotFound', message: String(e.message ?? e) })
      }
    })
    server.post('/api/pages', async (request, reply) => {
      const body = request.body as {
        path: string
        content?: string
        metadata?: any
      }
      try {
        await storage.createPage({
          path: body.path,
          content: body.content ?? '',
          metadata: body.metadata,
        })
        return reply.code(201).send({ success: true })
      } catch (e: any) {
        const message = String(e.message ?? e)
        if (/already exists/i.test(message))
          return reply.code(400).send({ error: 'PageExists', message })
        return reply.code(500).send({ error: 'StorageError', message })
      }
    })
    server.put('/api/pages/*', async (request, reply) => {
      const params = request.params as { '*': string }
      const body = request.body as {
        content?: string
        newName?: string
        metadata?: any
      }
      const path = params['*']
      if (
        typeof body.newName === 'string' &&
        (body.content !== undefined || body.metadata !== undefined)
      ) {
        return reply.code(400).send({
          error: 'BadRequest',
          message:
            'Cannot rename and update content/metadata in the same request. Use separate requests.',
        })
      }
      if (typeof body.newName === 'string' && body.newName.length > 0) {
        try {
          await storage.renamePage(path, body.newName)
          return { success: true }
        } catch (e: any) {
          const message = String(e.message ?? e)
          if (/not found/i.test(message))
            return reply.code(404).send({ error: 'NotFound', message })
          if (/already exists|path separators|Invalid path/i.test(message))
            return reply.code(400).send({ error: 'BadRequest', message })
          return reply.code(500).send({ error: 'StorageError', message })
        }
      }
      try {
        await storage.updatePage(path, {
          content: body.content,
          metadata: body.metadata,
        })
        return { success: true }
      } catch (e: any) {
        const message = String(e.message ?? e)
        if (/not found/i.test(message))
          return reply.code(404).send({ error: 'NotFound', message })
        return reply.code(500).send({ error: 'StorageError', message })
      }
    })
    server.delete('/api/pages/*', async (request, reply) => {
      const params = request.params as { '*': string }
      try {
        await storage.deletePage(params['*'])
        return { success: true }
      } catch (e: any) {
        const message = String(e.message ?? e)
        if (/not found/i.test(message))
          return reply.code(404).send({ error: 'NotFound', message })
        return reply.code(500).send({ error: 'StorageError', message })
      }
    })
  }

  return server
}

if (process.env.NODE_ENV !== 'test') {
  const server = buildServer()
  server.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' })
}
