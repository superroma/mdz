# AGENTS.md

## Cursor Cloud specific instructions

### Overview
MDZ is a filesystem-backed markdown wiki/editor. No database or Docker required. See `.cursor/rules/mdz.mdc` for primary dev commands and conventions.

### Services
| Service | Dev Port | Command |
|---------|----------|---------|
| Backend (Fastify) | 3001 | `npm run dev` (starts both) |
| Frontend (Vite/React) | 5173 | `npm run dev` (starts both) |

### Dev Authentication
In dev mode, a test auth plugin is automatically registered. Navigate to `http://localhost:3001/api/dev-auth/select` to pick a test user (admin, writer, reader, outsider). The frontend login page shows a "Continue with Test (Dev Only)" button that triggers this flow.

### Gotchas
- The `.env` file must be at `packages/backend/.env` (dotenv loads from `../../.env` relative to backend cwd, which resolves to repo root `.env` — but the `cp .env.example packages/backend/.env` setup also works since dev-server runs from `packages/backend/`).
- E2e tests spin up their own backend/frontend on ports 3201/3202 and copy `pages/` to a temp directory. They do not conflict with `npm run dev`.
- Frontend unit tests have pre-existing failures due to a React hooks compatibility issue with `react-router-dom` v7 + `happy-dom`. Backend unit tests pass cleanly.
- Lint has pre-existing errors across all workspaces (unused vars, `no-explicit-any`, etc.).
- Playwright Chromium must be installed for e2e tests: `npx playwright install chromium`.
