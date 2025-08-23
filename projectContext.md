# MDZ Project Summary

## Overview

MDZ is a minimal markdown-based collaboration tool that provides filesystem-backed markdown editing and viewing with MDX support. Built as an MVP focusing on essential features only, following TDD principles with YAGNI approach.

## Architecture

**Backend (Fastify + Node.js)**

- RESTful API at `/pages/*` (aliased as `/api/pages/*` in production)
- Local filesystem storage with smart file organization
- Health endpoint for monitoring

**Frontend (React + Vite + Tailwind)**

- Responsive SPA with sidebar navigation
- Three main components: Sidebar, Viewer, Editor
- MDX rendering with `@mdx-js/mdx` (dynamic imports disabled for security)
- Mobile-first responsive design with collapsible sidebar

**Testing Structure**

- Backend: Vitest unit tests for storage and routes
- Frontend: Vitest component tests with ARIA/a11y focus
- E2E: Playwright tests for CRUD workflows and routing
- Storybook: UI component stories with a11y addon

## Key Features

**Page Management**

- Create, read, update, delete, rename pages
- Hierarchical page structure with parent/child relationships
- Title extraction from filename (not metadata)

**Editing & Viewing**

- Plain markdown source editing in textarea
- MDX rendering for rich content display
- Save with Cmd/Ctrl+S support

**Navigation**

- Tree-based sidebar with expand/collapse
- Deep-link routing (`/p/:path`)
- 404 handling for deleted pages

## Storage Strategy

Smart file organization that adapts to content structure:

- **Single page**: `PageName.md`
- **Page with children**: Auto-converts to `PageName/README.md` + `PageName/Child.md`
- **Back to single**: Auto-converts back to `PageName.md` when last child removed
- **Title**: Always extracted from path basename, ignoring any metadata
- **Location**: `./pages` by default, configurable via `STORAGE_ROOT` env var

## Development

**Setup Commands**

```bash
# Development (concurrent backend + frontend)
pnpm dev

# Build for production
pnpm build

# Run all tests (backend + frontend + e2e)
pnpm test
```

**Technology Stack**

- TypeScript, ESLint, Prettier
- Backend: Fastify, Vitest
- Frontend: React, React Router, Vite, Tailwind CSS, Vitest
- E2E: Playwright with isolated test fixtures

**Key Directories**

- `app/backend/src/` - API server and storage logic
- `app/frontend/src/` - React components and client API
- `app/e2e/tests/` - End-to-end test suites
- `pages/` - Default markdown storage location
