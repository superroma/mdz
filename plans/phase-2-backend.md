# Phase 2: Backend & Storage Layer

## Goal

Implement the complete backend API with filesystem storage, smart folderization, and security features. All backend functionality should be fully tested with unit tests before moving to frontend integration.

## Prerequisites

- Phase 1 completed successfully
- All test infrastructure working
- Dev servers can start

## Core Requirements

**Storage System:**

- **Configurable storage location** via `PAGES_ROOT` environment variable
- Default to `pages/` directory at repository root
- Create storage directory if it doesn't exist on startup
- All file operations relative to configured root
- **Path traversal prevention using Node.js `path` module**
  - Use `path.resolve()` and `path.relative()` for validation
  - Block any paths that escape PAGES_ROOT
  - Validate all user-provided paths before filesystem operations

**Smart Folderization:**

Implement automatic file structure conversion based on content:

- **Page without children/attachments:** `PageName.md`
- **Page with children/attachments:**
  - Convert to `PageName/README.md`
  - Children stored as `PageName/Child.md`
  - Attachments stored as `PageName/file.ext`
- **Cleanup:** When last child removed and no attachments, convert back to `PageName.md`
- **Title extraction:** Always from filename/path, never from file content

**REST API Endpoints:**

All routes namespaced appropriately:

**Page Management (`/api/pages/*`):**

- `GET /api/pages` - List all pages with hierarchy
- `GET /api/pages/:path` - Get single page content
- `POST /api/pages` - Create new page (supports parent path)
- `PUT /api/pages/:path` - Update page content
- `PATCH /api/pages/:path` - Rename page (move file)
- `DELETE /api/pages/:path` - Delete page

**File Management (`/api/files/*`):**

- `GET /api/files/:pagePath` - List files attached to page
- `POST /api/files/:pagePath` - Upload file(s) to page
- `GET /api/files/:pagePath/:filename` - Download/serve file
- `DELETE /api/files/:pagePath/:filename` - Delete file

**Health Check:**

- `GET /api/health` - Server health status

**Request/Response Formats:**

Page object structure:

```typescript
{
  path: string;        // e.g., "Tasks/Write Tests"
  title: string;       // derived from filename
  content: string;     // markdown content
  frontMatter?: object; // parsed YAML front-matter
  children?: string[]; // child page paths
  parent?: string;     // parent page path
}
```

File listing structure:

```typescript
{
  files: [
    {
      name: string;
      size: number;
      uploadDate: string;
    }
  ]
}
```

**Front-Matter Support:**

- Parse YAML front-matter from markdown files
- Support `__schema` key in parent pages for defining child field schemas
- Return front-matter as separate property in page objects
- Serialize front-matter back when updating pages

**Security Requirements:**

- **Path traversal prevention is CRITICAL**
- Use `path.resolve(PAGES_ROOT, userPath)` and verify result starts with PAGES_ROOT
- Block `../` sequences that escape pages directory
- Validate all file paths in API endpoints
- Return 403 Forbidden for invalid path attempts
- File uploads: validate filenames, reject paths with `/` or `..`

**Error Handling:**

- 404 for pages/files that don't exist
- 403 for security violations (path traversal attempts)
- 400 for invalid requests (bad filenames, missing params)
- 500 for server errors with appropriate logging

## Seed Pages

**Purpose:**

- Demonstrate all application features to users
- Serve as living documentation
- **Used as test fixtures for BDD/E2E tests**
- Provide realistic test data for feature development
- When issues found, tests can be written against seed page scenarios

**Required Seed Pages:**

Create the following seed pages in the `pages/` directory:

**Welcome Page** (`pages/Welcome.md`):

- Introduction to the markdown editor
- Overview of key features
- Basic navigation instructions
- Link to other example pages

**Markdown Guide** (`pages/Markdown Guide.md`):

- GitHub-flavored Markdown (GFM) syntax examples (headers, lists, links, images, code blocks, tables, task lists)
- MDX-specific features and capabilities
- Formatting best practices
- Examples of view components

**Tasks Example** (`pages/Tasks/README.md`):

Parent page demonstrating custom field schema with view components:

```yaml
---
__schema:
  - name: status
    type: select
    options: [Todo, In Progress, Done]
  - name: priority
    type: select
    options: [Low, Medium, High]
  - name: due_date
    type: date
---
```

With sample child task pages:

- `pages/Tasks/Setup Development Environment.md` (status: Done, priority: High)
- `pages/Tasks/Write Tests.md` (status: In Progress, priority: High)
- `pages/Tasks/Deploy Application.md` (status: Todo, priority: Medium)
- `pages/Tasks/Update Documentation.md` (status: Todo, priority: Low)

**Projects Example** (`pages/Projects/README.md`):

Demonstrates different schema configuration:

```yaml
---
__schema:
  - name: status
    type: select
    options: [Planning, Active, On Hold, Completed]
  - name: owner
    type: text
  - name: budget
    type: number
  - name: start_date
    type: date
---
```

With sample project child pages demonstrating various field values.

**Seed Page Usage in Tests:**

- Tests should copy seed pages to temporary test directory before running
- Configure test environment to use temporary pages directory via `PAGES_ROOT` env variable
- Test against realistic page structures (Tasks, Projects, Markdown Guide, Welcome)
- When issues are found in seed pages, write tests that reproduce the problem
- Clean up temporary directory after tests complete

## Testing Requirements

**Unit Tests (packages/backend/tests/):**

Write unit tests for individual methods and functions to verify they work correctly in isolation. Focus on main code paths - not exhaustive coverage, but enough to debug when E2E tests fail.

**Purpose:**

- Provide fast, isolated tests for debugging specific methods
- When E2E tests fail, unit tests help pinpoint which method is broken
- Test both happy paths and critical error conditions
- Cover API route handlers, storage operations, folderization logic, security validation, and front-matter parsing

**Scope:**

- Test methods that implement core logic (storage, folderization, path validation, etc.)
- Test API route handlers (request validation, response format, error handling)
- Test critical edge cases (path traversal, invalid inputs, missing files)
- Don't test trivial getters/setters or simple wrappers

**Test Data:**

- Use temporary test directories for each test
- **Use seed pages as test fixtures wherever possible:**
  - Copy seed pages to temporary test directory before running tests
  - Configure test backend to use temporary directory via `PAGES_ROOT` environment variable
  - Test against realistic page structures (Tasks, Projects, Markdown Guide, Welcome)
  - When issues are found, write tests that reproduce the problem using seed page scenarios
- Clean up test directories after tests
- Do not modify actual `pages/` directory during tests

**E2E Backend API Tests (packages/e2e/):**

These tests should verify that the backend API is ready for consumption by a React frontend:

- Test all API endpoints respond with correct status codes and data formats
- Verify CORS headers are properly configured for frontend access
- Test that API responses match the TypeScript interfaces defined for frontend consumption
- Validate error responses return appropriate JSON with error messages
- Test complete workflows (create → read → update → delete)
- Verify the API can handle typical React application usage patterns
- **Test against seed pages as realistic test fixtures**

**Requirements:**

- Tests should make actual HTTP requests to the running backend server
- Should verify response JSON structure matches expected format
- Should test happy paths and common error scenarios
- Should validate that basic React fetch/axios calls would work correctly
- **Use seed pages as test data:**
  - Before each test suite, copy seed pages to temporary test directory
  - Point test backend to temporary directory via `PAGES_ROOT` environment variable
  - Test operations against realistic page structures (Tasks with schema, Projects, etc.)
  - Clean up temporary directory after tests complete

**Feature File for Backend:**

Create `packages/e2e/features/storage.feature`:

```gherkin
Feature: Backend Storage Operations
  As a system
  I need to store and retrieve pages from the filesystem
  So that content persists between sessions

  Background:
    Given seed pages are loaded in a temporary test directory
    And the backend is configured to use the test directory

  Scenario: Create a page
    When I create a page named "Test Page"
    Then the file "Test Page.md" should exist
    And I should be able to read the page content

  Scenario: Folderization on child creation
    Given a page "Parent.md" exists
    When I create a child page "Parent/Child"
    Then "Parent.md" should not exist
    And "Parent/README.md" should exist
    And "Parent/Child.md" should exist

  Scenario: Read seed pages with front-matter
    When I request the page "Tasks/Write Tests"
    Then I should receive a 200 response
    And the response should include front-matter with status "In Progress"
    And the response should include front-matter with priority "High"

  Scenario: List pages with hierarchy
    When I request the list of all pages
    Then I should see "Welcome" as a root page
    And I should see "Tasks" as a root page with children
    And I should see "Projects" as a root page with children
    And "Tasks" should have 4 child pages

  Scenario: Prevent path traversal
    When I attempt to access "../../../etc/passwd"
    Then I should receive a 403 Forbidden response
```

## Success Criteria

Phase 2 is complete when:

1. **All API endpoints implemented and working:**

   - Can create, read, update, delete pages via API
   - Can upload, list, download, delete files via API
   - Health check returns 200

2. **Smart folderization works correctly:**

   - Single file converts to folder when needed
   - Folder converts back to single file when appropriate
   - Parent/child relationships maintained

3. **Security implemented:**

   - Path traversal attempts blocked
   - All file operations validate paths
   - No way to access files outside PAGES_ROOT

4. **All unit tests pass:**

   - Core methods have unit tests for main code paths
   - Tests help isolate and debug issues found in E2E tests
   - Coverage includes storage, folderization, security, API handlers

5. **Backend E2E scenarios pass:**

   - Storage feature scenarios pass
   - Tests use temporary directories with seed pages as fixtures
   - Seed pages can be read and parsed correctly (including front-matter)

6. **Manual testing works:**
   - Can call API endpoints with curl/Postman
   - Files created in correct locations
   - Front-matter parsed correctly

## Deliverables

- Complete backend API implementation
- Comprehensive unit test suite (all passing)
- Backend-focused E2E feature files
- **Seed pages in `pages/` directory** (Welcome, Markdown Guide, Tasks with children, Projects with children)
- API documentation (as code comments or simple markdown)
- Security validation for all file operations

## Notes

- Focus on backend only - no frontend integration yet
- All functionality should be testable via API calls
- Prioritize test coverage over performance optimization
- Use TypeScript types for API contracts
- Keep code self-documenting with clear function names
