# UI State Plan: Sidebar Selection and Pages Store

- Library: Zustand for view-model/store. Tiny, no boilerplate, unit-testable, fits MVP/YAGNI.
- Router remains source-of-truth for selection; components read selection from URL and data from store.

## Scope

- Decouple UI from `api` by introducing a `pages` store that encapsulates all page CRUD and tree loading.
- UI reads `tree` from store and calls store actions; no direct `api` calls in components.
- Auto-select-first-item logic moves to a small top-level effect that reacts to store `tree` + router.

## Store shape (`src/store/pages.store.ts`)

- State:
  - `tree: { path: string; title: string; children?: Node[] }[]`
  - `loading: boolean`
  - `error?: string`
- Actions:
  - `loadTree()`
  - `createRootUntitled(): Promise<string>`
  - `createChildUntitled(parentPath: string): Promise<string>`
  - `renamePath(oldPath: string, newName: string)`
  - `deletePath(path: string)`
  - Internals: `generateAvailableName(base: string, parentPath?: string)`
- Note: Store does not own `selectedPath`; router does.

## Component updates

- `Sidebar`:
  - Replace `api` usage with `usePagesStore` selectors/actions.
  - Highlight selected item by comparing node path with `useParams().path`.
- `App` (or a tiny hook):
  - Effect: after `loadTree()` completes, if no selected path and `tree.length > 0`, navigate to first page.

## TDD

- Unit tests (store): load tree, create unique “Untitled”, rename/delete happy paths, error mapping. Mock `api`.
- Frontend tests: sidebar renders from store, highlights selection from router param.
- E2E: startup selects first page; deleting current selects previous/first.

## Steps

1. Add `zustand` to frontend.
2. Implement `pages.store.ts` with actions above (uses `api` internally).
3. Update `Sidebar` to use store.
4. Add top-level auto-select effect in `App`.
5. Tests (store + frontend), then E2E.
