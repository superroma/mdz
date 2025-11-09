# Multi-Phase Implementation Guide

This directory contains a progressive implementation plan split into 4 distinct phases. Each phase builds on the previous one and has clear, testable outcomes.

## Phase Overview

### Phase 1: Project Setup & Test Infrastructure
**File:** `phase-1-setup.md`

**Goal:** Set up monorepo structure with all testing frameworks working.

**Key Outcomes:**
- Monorepo with 3 packages (backend, frontend, e2e)
- All test frameworks configured (unit tests, component tests, Playwright + Cucumber)
- Basic "hello world" implementations
- Health check E2E test passing
- All dev servers can start

**Success Check:**
```bash
npm run dev        # Both servers start
npm run test       # Unit tests pass
npm run test:e2e   # Health check E2E passes
```

---

### Phase 2: Backend & Storage Layer
**File:** `phase-2-backend.md`

**Goal:** Complete backend API with filesystem storage and security.

**Key Outcomes:**
- REST API for page CRUD operations
- REST API for file upload/download/delete
- Smart folderization logic
- Path traversal prevention (security)
- Front-matter parsing
- Comprehensive unit tests
- Backend-focused E2E tests

**Success Check:**
```bash
npm run test       # All backend unit tests pass
npm run test:e2e   # Storage feature tests pass
curl http://localhost:3001/api/pages  # Returns page list
```

---

### Phase 3: Frontend Core & Page Management
**File:** `phase-3-frontend.md`

**Goal:** Complete UI with navigation, editing, and responsive design.

**Key Outcomes:**
- Sidebar with tree navigation
- Breadcrumbs and back button
- Page creation/editing/deletion
- Notion-style title field (always editable, auto-save)
- Content editor (view/edit modes)
- Responsive design (mobile hamburger menu)
- Client-side routing with deep links
- Component tests
- Navigation/editing/responsive E2E tests

**Success Check:**
```bash
npm run dev        # Open browser, create/edit/delete pages
npm run test:e2e   # All navigation/editing/responsive tests pass
```

---

### Phase 4: Advanced Features & Integration
**File:** `phase-4-advanced.md`

**Goal:** GitHub-flavored Markdown (GFM) and MDX rendering, custom fields, file uploads, MDX views, seed pages.

**Key Outcomes:**
- GitHub-flavored Markdown (GFM) and MDX rendering in viewer
- Custom fields system (schema definition, editable fields)
- File upload/download/delete UI
- 5 MDX view components (BoardView, GridView, CalendarView, ListView, Tabs)
- Seed pages (Welcome, Markdown Guide, Tasks, Projects)
- Complete E2E test coverage
- **All tests passing**

**Success Check:**
```bash
npm run dev        # Application loads with seed pages
npm run test       # All unit tests pass
npm run test:e2e   # ALL E2E tests pass (CRITICAL)
# Manual: verify all features work in browser
```

---

## Implementation Strategy

### Sequential Execution

Execute phases in order:
1. Complete Phase 1 entirely before starting Phase 2
2. Complete Phase 2 entirely before starting Phase 3
3. Complete Phase 3 entirely before starting Phase 4
4. Don't move forward if tests are failing

### Test-Driven Approach

For each phase:
1. Read phase requirements
2. Write feature files (Gherkin scenarios) first
3. Run tests to see them fail
4. Implement minimal code to pass tests
5. Refactor with tests green
6. Move to next phase only when all tests pass

### Failure Recovery

If something goes wrong in a phase:
1. Tests will catch the issue
2. Fix the specific failing test
3. Re-run test suite
4. Don't proceed until all tests pass

Each phase is self-contained enough to debug independently.

---

## Testing Philosophy

### BDD/TDD Workflow

1. **Feature files are the source of truth** for all behavior
2. **Write .feature files before implementing** functionality
3. **Tests must be non-interactive** (no watch mode, no prompts)
4. **All tests must pass** before moving to next phase

### Test Layers

- **E2E (Playwright + Cucumber):** Complete user workflows, most important
- **Unit tests:** Backend storage, folderization, security
- **Component tests:** Frontend UI components

### Critical Rule

**NEVER declare a phase complete without running and passing all tests.**

---

## Project Context

This multi-phase plan was created from a comprehensive requirements document (`prompt.md`). The original document contains:
- Detailed feature specifications
- UI/UX guidelines
- Technical stack choices
- Success criteria

Refer to the original `prompt.md` for detailed specifications when implementing each phase.

---

## Development Commands

After Phase 1 setup, these commands will be available:

```bash
# Development
npm run dev              # Start both frontend and backend servers

# Testing
npm run test             # Run all unit tests
npm run test:e2e         # Run all E2E tests (Playwright + Cucumber)

# Building
npm run build            # Build all packages
```

Individual package commands:
```bash
# Backend
cd packages/backend
npm run dev              # Start backend server
npm test                 # Run backend unit tests

# Frontend
cd packages/frontend
npm run dev              # Start frontend dev server
npm test                 # Run component tests

# E2E
cd packages/e2e
npm run test:e2e         # Run E2E tests
```

---

## Environment Configuration

Each phase will use environment variables for configuration:

**Backend:**
- `PAGES_ROOT` - Directory for storing pages (default: `pages/`)
- `PORT` - Server port (default: 3001)

**Frontend:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`)

**E2E:**
- `TEST_PAGES_ROOT` - Temporary directory for test pages
- `FRONTEND_URL` - Frontend URL for testing (default: `http://localhost:5173`)
- `BACKEND_URL` - Backend URL for testing (default: `http://localhost:3001`)

---

## Timeline Estimate

Approximate time per phase (for reference):

- **Phase 1:** 2-4 hours (project setup, tooling configuration)
- **Phase 2:** 4-6 hours (backend API, storage logic, security)
- **Phase 3:** 6-8 hours (UI components, navigation, responsive design)
- **Phase 4:** 6-10 hours (advanced features, views, seed pages, final integration)

**Total:** ~18-28 hours for complete implementation

These are estimates. Take whatever time needed to ensure quality and passing tests.

---

## Notes

- Each phase is documented in detail in its own file
- Read the entire phase document before starting implementation
- Follow BDD/TDD workflow strictly
- Prioritize test coverage over speed
- Keep code clean and self-documenting
- Use TypeScript for type safety throughout
- No extensive comments needed (clear names suffice)

---

## Success Criteria

The project is complete when:

1. All 4 phases implemented
2. All tests passing (unit, component, E2E)
3. `npm run dev` loads working application with seed pages
4. All features functional in browser
5. Responsive design works on mobile and desktop
6. No linter errors, no console errors
7. Application is polished and usable

**Remember: Tests are not optional. They are the acceptance criteria.**

