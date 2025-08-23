import { promises as fs } from 'node:fs'
import { dirname, join, posix } from 'node:path'

export type Page = {
  path: string
  title: string
  content: string
}

export type PageTreeNode = {
  path: string
  title: string
  children: PageTreeNode[]
}

export function createStorage(rootDir: string) {
  const normalizePath = (p: string) =>
    p.replace(/\\/g, '/').replace(/\.md$/, '')
  const splitParts = (p: string) => normalizePath(p).split('/').filter(Boolean)
  const guardParts = (parts: string[]) => {
    if (parts.length === 0 || parts.some((seg) => seg === '..')) {
      throw new Error('Invalid path')
    }
  }
  const singlePathFor = (name: string) => join(rootDir, `${name}.md`)
  const readmePathFor = (parts: string[]) =>
    join(rootDir, ...parts, 'README.md')
  const childPathFor = (parts: string[]) => join(rootDir, ...parts) + '.md'
  const dirPathFor = (parts: string[]) => join(rootDir, ...parts)

  async function exists(path: string) {
    try {
      await fs.stat(path)
      return true
    } catch {
      return false
    }
  }

  async function resolveKind(
    parts: string[],
  ): Promise<'single' | 'folder' | 'missing'> {
    guardParts(parts)
    if (parts.length === 1) {
      const name = parts[0]
      const single = singlePathFor(name)
      const readme = readmePathFor([name])
      if (await exists(readme)) return 'folder'
      // treat existing directory without README as folder
      try {
        const s = await fs.stat(dirPathFor([name]))
        if (s.isDirectory()) return 'folder'
      } catch {}
      if (await exists(single)) return 'single'
      return 'missing'
    }
    // child path
    const child = childPathFor(parts)
    return (await exists(child)) ? 'single' : 'missing'
  }

  async function ensureFolderForParent(parentParts: string[]) {
    const kind = await resolveKind(parentParts)
    if (kind === 'single') {
      const src = childPathFor(parentParts)
      const dst = readmePathFor(parentParts)
      await fs.mkdir(dirname(dst), { recursive: true })
      await fs.rename(src, dst)
    }
    if (kind === 'missing') {
      // ensure directory exists
      await fs.mkdir(dirPathFor(parentParts), { recursive: true })
    }
  }

  async function maybeUnfolderParentIfEmpty(parentParts: string[]) {
    const dir = dirPathFor(parentParts)
    let entries: string[] = []
    try {
      entries = await fs.readdir(dir)
    } catch {
      return
    }
    const mdFiles = entries.filter((n) => n.endsWith('.md'))
    const children = mdFiles.filter((n) => n !== 'README.md')
    if (children.length === 0 && mdFiles.includes('README.md')) {
      // convert back to single
      const src = readmePathFor(parentParts)
      const dst = childPathFor(parentParts)
      const content = await fs.readFile(src, 'utf8')
      await fs.writeFile(dst, content)
      await fs.unlink(src)
      try {
        await fs.rmdir(dir)
      } catch {}
    }
  }

  const titleFromPath = (p: string) => posix.basename(normalizePath(p))

  async function readFileWithMetadata(
    filePath: string,
  ): Promise<{ content: string; metadata: PageMetadata }> {
    const raw = await fs.readFile(filePath, 'utf8')
    if (raw.startsWith('---\n')) {
      const end = raw.indexOf('\n---\n', 4)
      if (end !== -1) {
        const header = raw.slice(4, end)
        try {
          const meta = JSON.parse(header) as Partial<PageMetadata>
          const metadata: PageMetadata = {
            tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
            icon: typeof meta.icon === 'string' ? meta.icon : 'file-text',
            created_at:
              typeof meta.created_at === 'string'
                ? meta.created_at
                : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          const content = raw.slice(end + 5)
          return { content, metadata }
        } catch {}
      }
    }
    const now = new Date().toISOString()
    return {
      content: raw,
      metadata: {
        tags: [],
        icon: 'file-text',
        created_at: now,
        updated_at: now,
      },
    }
  }

  async function writeFileWithMetadata(
    filePath: string,
    content: string,
    metadata: PageMetadata,
  ) {
    const header = `---\n${JSON.stringify(metadata)}\n---\n`
    await fs.writeFile(filePath, header + (content ?? ''))
  }

  return {
    async ensureStorageRoot() {
      await fs.mkdir(rootDir, { recursive: true })
    },

    async getPageTree(): Promise<PageTreeNode[]> {
      async function walk(
        dir: string,
        relative: string,
      ): Promise<PageTreeNode[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const nodes: PageTreeNode[] = []
        for (const e of entries) {
          if (e.isFile() && e.name.endsWith('.md')) {
            if (e.name === 'README.md') continue
            const name = e.name.slice(0, -3)
            nodes.push({
              path: posix.join(relative, name),
              title: name,
              children: [],
            })
          } else if (e.isDirectory()) {
            const subdir = join(dir, e.name)
            const rel = posix.join(relative, e.name)
            const readme = join(subdir, 'README.md')
            let hasReadme = false
            try {
              await fs.stat(readme)
              hasReadme = true
            } catch {}

            const children = await walk(subdir, rel)

            // include directory as node regardless of README or children
            nodes.push({ path: rel, title: e.name, children })
          }
        }
        return nodes
      }
      try {
        const exists = await fs.stat(rootDir)
        if (!exists.isDirectory()) return []
      } catch {
        return []
      }
      return walk(rootDir, '')
    },

    async getPage(path: string): Promise<Page> {
      const parts = splitParts(path)
      guardParts(parts)
      let file: string
      if (parts.length === 1) {
        const kind = await resolveKind(parts)
        if (kind === 'folder') {
          const readme = readmePathFor(parts)
          if (await exists(readme)) file = readme
          else
            return {
              path: normalizePath(path),
              title: titleFromPath(path),
              content: '',
            }
        } else if (kind === 'single') file = singlePathFor(parts[0])
        else throw new Error(`Page not found: ${path}`)
      } else {
        file = childPathFor(parts)
      }
      try {
        const content = await fs.readFile(file, 'utf8')
        return {
          path: normalizePath(path),
          title: titleFromPath(path),
          content,
        }
      } catch {
        throw new Error(`Page not found: ${path}`)
      }
    },

    async createPage({ path, content }: { path: string; content: string }) {
      const parts = splitParts(path)
      guardParts(parts)
      if (parts.length === 1) {
        const dest = singlePathFor(parts[0])
        try {
          await fs.stat(dest)
          throw new Error(`Page already exists: ${path}`)
        } catch {}
        await fs.writeFile(dest, content ?? '')
        return
      }
      // child
      const parentParts = parts.slice(0, -1)
      await ensureFolderForParent(parentParts)
      const childFile = childPathFor(parts)
      await fs.mkdir(dirname(childFile), { recursive: true })
      try {
        await fs.stat(childFile)
        throw new Error(`Page already exists: ${path}`)
      } catch {}
      await fs.writeFile(childFile, content ?? '')
    },

    async updatePage(path: string, { content }: { content?: string }) {
      const parts = splitParts(path)
      guardParts(parts)
      let file: string
      if (parts.length === 1) {
        const kind = await resolveKind(parts)
        if (kind === 'folder') {
          const readme = readmePathFor(parts)
          if (await exists(readme)) file = readme
          else {
            // create README if updating folder parent with no README yet
            await fs.mkdir(dirPathFor(parts), { recursive: true })
            file = readme
          }
        } else if (kind === 'single') file = singlePathFor(parts[0])
        else throw new Error(`Page not found: ${path}`)
      } else {
        file = childPathFor(parts)
      }
      try {
        await fs.stat(file)
      } catch {
        throw new Error(`Page not found: ${path}`)
      }
      if (content !== undefined) await fs.writeFile(file, content)
    },

    async renamePage(path: string, newName: string) {
      const norm = normalizePath(path)
      const parts = norm.split('/').filter(Boolean)
      if (newName.includes('/') || newName.includes('\\')) {
        throw new Error('newName must be a simple name without path separators')
      }
      if (parts.length === 0) throw new Error('Invalid path')
      if (parts.length === 1) {
        // rename parent: if folder exists, move directory; else rename file
        const parent = parts[0]
        const kind = await resolveKind([parent])
        if (kind === 'missing') throw new Error(`Page not found: ${path}`)
        if (kind === 'folder') {
          const srcDir = join(rootDir, parent)
          const dstDir = join(rootDir, newName)
          try {
            await fs.stat(dstDir)
            throw new Error(`Page already exists: ${newName}`)
          } catch {}
          await fs.rename(srcDir, dstDir)
        } else {
          const src = singlePathFor(parent)
          const dst = singlePathFor(newName)
          try {
            await fs.stat(dst)
            throw new Error(`Page already exists: ${newName}`)
          } catch {}
          await fs.rename(src, dst)
        }
        return
      }
      // child rename
      const parent = parts.slice(0, -1).join('/')
      const src = childPathFor(parts)
      const dst = childPathFor([...parts.slice(0, -1), newName])
      try {
        await fs.stat(src)
      } catch {
        throw new Error(`Page not found: ${path}`)
      }
      try {
        await fs.stat(dst)
        throw new Error(`Page already exists: ${posix.join(parent, newName)}`)
      } catch {}
      await fs.rename(src, dst)
    },

    async deletePage(path: string) {
      const parts = splitParts(path)
      guardParts(parts)
      if (parts.length === 1) {
        const kind = await resolveKind(parts)
        if (kind === 'missing') throw new Error(`Page not found: ${path}`)
        if (kind === 'folder') {
          // recursive delete directory
          const dir = join(rootDir, parts[0])
          const entries = await fs.readdir(dir)
          for (const name of entries) {
            await fs.unlink(join(dir, name))
          }
          try {
            await fs.rmdir(dir)
          } catch {}
        } else {
          const file = singlePathFor(parts[0])
          await fs.unlink(file)
        }
        return
      }
      // child delete
      const file = childPathFor(parts)
      try {
        await fs.unlink(file)
      } catch {
        throw new Error(`Page not found: ${path}`)
      }
      await maybeUnfolderParentIfEmpty(parts.slice(0, -1))
    },
  }
}
