# MDZ MVP Checklist

- [x] Bootstrap

  - [x] pnpm workspace, TypeScript, ESLint/Prettier, Vitest, Playwright
  - [x] Project structure: `app/backend`, `app/frontend`, `app/e2e`
  - [x] Smoke tests for tooling

- [x] Backend

  - [x] Storage: ensure root; read/write/update/delete; rename; tree build
  - [x] Title from path; metadata passthrough with defaults
  - [x] Routes: GET tree, GET page, POST create, PUT update/rename, DELETE, health
  - [x] Unit tests: storage
  - [x] Route tests: success/error incl. rename rules
  - [x] Production API alias: expose `/api/pages` routes in production (or adjust frontend to call `/pages`)
  - [x] Rename semantics: reject PUT `/pages/*` requests that include both `newName` and `content/metadata` with 400
  - [x] Metadata tests: backend unit tests for metadata create/update/read

- [x] Frontend API

  - [x] Implement client mirroring current endpoints
  - [x] Unit tests: path encoding, error mapping

- [x] Frontend UI

  - [x] Router scaffolding and page layout
  - [x] Sidebar (ARIA list/navigation), loads tree, selects page
  - [x] Viewer: MDX render (`@mdx-js/mdx`) with minimal components
  - [x] Editor: textarea, Save, Cmd/Ctrl+S
  - [x] Main actions: Create, Rename, Delete
  - [x] Behavior tests for Sidebar/Router/Viewer/Editor
  - [x] Viewer MDX runtime safety: disable dynamic import or sandbox/evaluate to avoid arbitrary imports

- [x] Accessibility

  - [x] Add roles/labels where needed
  - [x] Tests using role/label queries for key flows

- [x] Storybook

  - [x] Configure Storybook
  - [x] Stories: Sidebar
  - [x] Stories: Viewer, Editor, Buttons/Inputs
  - [x] a11y addon configured in `.storybook/main.ts`
  - [x] a11y addon checks pass

- [x] E2E (Playwright)

  - [x] CRUD flows pass (create/edit/save, rename, delete) — basic happy path
  - [x] Deep-link routing — basic route loads
  - [x] 404 handling for deleted pages
  - [x] Isolated `pages/` fixtures

- [x] Dev/build

  - [x] `dev` concurrent backend+frontend (via e2e webServer)
  - [x] `build` backend+frontend; serve `dist` in production
  - [ ] CI disabled for now
