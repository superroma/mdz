# Phase 1: Project Setup & Test Infrastructure

## Goal

Set up a working monorepo project structure with all required testing frameworks configured and ready to use. This phase establishes the foundation without implementing actual features.

## Requirements

**Monorepo Structure:**

- Use package manager with workspace support (npm, pnpm, or yarn)
- Three packages:
  - `packages/backend` - Backend API server
  - `packages/frontend` - React frontend with Vite
  - `packages/e2e` - End-to-end tests with Playwright + Cucumber
- Shared TypeScript configuration
- Root-level scripts for running tests and dev servers

**Backend Package Setup:**

- Node.js TypeScript project
- Choose lightweight HTTP server framework
- Basic project structure (src/, tests/)
- Unit test framework configured
- ESLint and TypeScript configured
- Package.json scripts: `dev`, `build`, `test`
- Single "hello world" endpoint to verify server works
- Single unit test that passes

**Frontend Package Setup:**

- React + TypeScript + Vite project
- CSS utility framework installed (Tailwind recommended)
- Component test framework configured
- ESLint and TypeScript configured
- Package.json scripts: `dev`, `build`, `preview`, `test`
- Basic App component that renders "Hello World"
- Single component test that passes

**E2E Package Setup:**

- Playwright installed and configured
- Playwright start its own servers, so tests are self-contained
- `@cucumber/cucumber` installed
- Feature files directory: `packages/e2e/features/`
- Step definitions directory: `packages/e2e/step-definitions/`
- Playwright config for running against local dev servers
- One simple feature file that tests a basic scenario
- Step definitions for that feature
- Package.json scripts: `test:e2e` (non-interactive, runs to completion)

**Environment Configuration:**

- Backend uses environment variable `PAGES_ROOT` (default: `pages/`)
- Frontend uses environment variable for API URL (default: `http://localhost:3001`)
- `.env.example` files in each package
- `.gitignore` configured properly

**Root Package Configuration:**

- Root package.json with workspace scripts:
  - `npm run dev` - Start both backend and frontend dev servers
  - `npm run test` - Run all unit tests
  - `npm run test:e2e` - Run E2E tests
  - `npm run build` - Build all packages
- Concurrent script execution for `dev` (both servers at once)

## Sample Feature File

Create `packages/e2e/features/health-check.feature`:

```gherkin
Feature: Application Health Check
  As a developer
  I want to verify the application infrastructure is working
  So that I can build features on a solid foundation

  Scenario: Backend server is running
    Given the backend server is running
    When I request the health check endpoint
    Then I should receive a successful response

  Scenario: Frontend application loads
    Given the frontend application is running
    When I navigate to the homepage
    Then I should see the application interface
```

## Success Criteria

The setup is complete when:

1. **Project structure exists:**

   - All three packages created
   - Dependencies installed
   - TypeScript compiles without errors

2. **Backend works:**

   - `npm run dev` in backend package starts server
   - Health check endpoint responds at `/health`
   - Unit tests run and pass (`npm test`)

3. **Frontend works:**

   - `npm run dev` in frontend package starts Vite server
   - Browser shows React app with "Hello World"
   - Component tests run and pass (`npm test`)

4. **E2E tests work:**

   - `npm run test:e2e` runs Playwright + Cucumber
   - Health check feature scenarios pass
   - Tests run non-interactively and exit automatically

5. **Root scripts work:**

   - `npm run dev` from root starts both servers concurrently
   - `npm run test` from root runs all unit tests
   - `npm run test:e2e` from root runs E2E tests

6. **No linter errors:** All packages pass TypeScript and ESLint checks

## Testing Strategy

- Write the health check feature file first
- Implement step definitions
- Verify tests fail initially
- Implement minimal code to make tests pass
- All tests must be non-interactive (no watch mode, no prompts)

## Deliverables

- Working monorepo with all packages configured
- One passing unit test in backend
- One passing component test in frontend
- Two passing E2E scenarios in health-check feature
- All dependencies installed
- All dev servers can start successfully
- Documentation in each package for running locally

## Technical Stack Decisions Needed

Choose and document in package.json:

- Backend HTTP framework (Express, Fastify, Hono, etc.)
- CSS framework (Tailwind, etc.)
- Frontend unit test framework (Vitest, Jest, etc.)
- Zustand for state management

## Notes

- Keep everything minimal - no actual page features yet
- Focus on infrastructure that will support future phases
- Ensure test runners exit cleanly (critical for CI/CD)
- Verify hot reload works in both frontend and backend
