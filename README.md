# mdz

Markdown-based collaboration tool

## Start Here

- Goal: Minimal markdown editor/viewer; filesystem storage; MDX render.
- Backend: Fastify `/pages/*` (prod alias `/api/pages/*`), local storage.
- Frontend: Vite+React; Sidebar/Viewer/Editor; MDX evaluate with dynamic imports disabled.
- Dev: `pnpm -C app/backend dev` and `pnpm -C app/frontend dev`
- See `plan.md` for scope and `checklist.md` for progress.

Pages location

- Default storage root: `./pages` at repo root
- Structure: `Page.md`; when first child added → `Page/README.md` + `Page/Child.md`; when last child removed → back to `Page.md`
- Override with `STORAGE_ROOT=/absolute/path pnpm -C app/backend dev`
