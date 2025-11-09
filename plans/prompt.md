# Markdown Editor/Viewer with Filesystem Storage

## Goal

Build a minimal markdown editor and viewer that stores content as plain files on the filesystem. Follow MVP principles - implement only essential features using Test-Driven Development.

## Core Requirements

**Application Purpose:**

- Allow users to create, read, update, and delete markdown pages
- Support hierarchical page organization (parent/child relationships)
- Render GitHub-flavored Markdown (GFM) and MDX
- Store everything as plain text files with no database

**Architecture:**

- **Backend:** RESTful API server that manages filesystem operations
  - Expose endpoints for CRUD operations on pages
  - Expose endpoints for file upload/download/delete operations
  - Routes should be namespaced (e.g., `/pages/*`, `/files/*`)
  - Include health check endpoint
  - Use local filesystem as storage layer
  - **MUST support configurable storage location via environment variable (e.g., `PAGES_ROOT`)**
  - Default to `pages/` directory if not configured
  - Essential for testing (temporary test directories) and deployment flexibility
  - **File handling security:** Use trusted library for path validation (prevent directory traversal)
- **Frontend:** React single-page application built with Vite
  - Three main component areas: Sidebar, Viewer, Editor
  - Hierarchical navigation tree
  - Client-side routing with deep links
  - Zustand for state management
  - CSS utility framework for styling
- **Responsive Design:**
  - Mobile: sidebar hidden by default with hamburger toggle button
  - Desktop: sidebar always visible at fixed width
  - Support keyboard shortcuts (Cmd/Ctrl+S for save)

## Storage Strategy

**Storage Location:**

- Pages stored in configurable directory (default: `pages/` at repository root)
- **MUST be configurable via environment variable** for deployment flexibility and testing
- Examples: `pages/Welcome.md`, `pages/Tasks/README.md`
- Tests should use temporary directories with copied seed pages

**Smart Folderization:**

Implement "smart folderization" that adapts file structure to content hierarchy:

- **Page without children or attachments:** Store as single file `PageName.md`
- **Page with children or uploaded files:** Automatically convert to folder structure:
  - `PageName/README.md` (parent content)
  - `PageName/Child.md` (child pages)
  - `PageName/attachment.png` (uploaded files)
- **Cleanup:** When last child is removed and no attachments exist, automatically convert back to single file `PageName.md`
- **Title extraction:** Always derive page title from filename/path, never from file metadata
- **Front-matter support:** Store YAML front-matter for custom fields
  - Each page can define custom field schemas for its children
  - Child pages use front-matter to store values for parent-defined fields
  - Use a special `__schema` key in parent's front-matter to define child field schemas

## Testing Strategy

Follow strict BDD/TDD approach with behavior-first specifications:

**BDD Infrastructure:**

- Use Gherkin syntax for all behavioral specifications
- Store feature files in `packages/e2e/features/`
- Implement using Playwright with `@cucumber/cucumber`
- All user-facing behaviors must be defined in `.feature` files before implementation
- Feature files serve as living documentation and executable specifications
- **All behavioral scenarios described in this prompt should be converted to Gherkin feature files**
- **Use seed pages as test fixtures wherever possible**
  - Tests should copy seed pages to temporary test directory
  - Configure test environment to use temporary pages directory
  - This allows testing against realistic page structures
  - When issues found in seed pages, write tests that reproduce the problem

**Testing Layers:**

1. **BDD Feature Specifications (E2E with Playwright + Cucumber):**

   - **E2E-first policy:** When user describes a behavior, write `.feature` file first
   - Use Gherkin syntax (Given/When/Then) for all scenarios
   - Test complete user workflows (create → edit → save → delete)
   - Test navigation and routing with URL assertions
   - Test responsive behavior (mobile vs desktop)
   - Use role/label selectors for stability in step definitions
   - Assert both UI state and URL changes
   - Run against actual dev servers (not mocked)
   - Features cover: page management, navigation, editing, custom fields, responsive UI
   - **Use seed pages as test data:**
     - Before each test suite, copy seed pages to temporary test directory
     - Point test backend to temporary directory via environment variable
     - Test against realistic page structures (Tasks, Projects, Markdown Guide)
     - Clean up temporary directory after tests complete

2. **Unit Tests (Backend):**

   - Test storage operations in isolation
   - Test API route handlers
   - Test file system edge cases (concurrency, missing files, invalid paths)
   - Test folderization logic thoroughly
   - Test custom field schema inheritance
   - Test field validation based on schema type
   - Test front-matter parsing and serialization
   - **Test file upload/download/delete operations**
   - **Test path traversal prevention (security)**
   - Test that paths outside pages/ root are blocked
   - Test file listing excludes README.md and child pages

3. **Component Tests (Frontend):**

   - Focus on ARIA labels and accessibility
   - Test UI behavior (tree navigation, selection states)
   - Separate presentation from behavior (test viewmodels)
   - Use component development environment for iteration
   - Test MDX content rendering with image and link resolution
   - Test path resolution logic (relative, absolute, parent navigation)
   - Test URL encoding for spaces and special characters

**BDD/TDD Workflow:**

1. When new behavior is requested: write Gherkin scenario in `.feature` file first
2. Run scenario to confirm it fails for the right reason
3. Implement step definitions (Playwright actions/assertions)
4. Implement minimal code to make scenario pass
5. Refactor with scenarios green
6. Feature files are the source of truth for all behavior
7. **After implementing features: run full e2e test suite to verify everything works**

**Test Execution Rules:**

- **NEVER run Playwright or any test runner in watch mode**
- **NEVER use interactive test modes** that wait for user input (h, q, etc.)
- Always run tests in CI/non-interactive mode
- Use `--reporter=list` or similar non-interactive reporters
- Tests should run to completion and exit immediately
- No prompts, no waiting for keypress, no interactive menus
- **MUST run full test suite before declaring implementation complete**

**Feature File Organization:**

- `features/page-management.feature` - Creating, renaming, deleting pages
- `features/navigation.feature` - Sidebar, tree navigation, deep linking, breadcrumbs, root URL redirect
- `features/editing.feature` - Title field, content editor, save operations
- `features/custom-fields.feature` - Schema definition, field editing, inheritance
- `features/file-uploads.feature` - Uploading, listing, downloading, deleting attachments
- `features/mdx-views.feature` - BoardView, GridView, CalendarView, ListView components
- `features/formatting.feature` - Markdown/MDX rendering, image resolution, link resolution
- `features/responsive.feature` - Mobile/desktop behavior, hamburger menu
- `features/storage.feature` - Folderization, file operations
- `features/security.feature` - Path traversal prevention, file access validation
- `features/dev-environment.feature` - Test that `npm run dev` loads seed pages correctly

## Key Features

**Page Management:**

- Create pages with "Untitled" default → immediate inline rename
- Rename pages (updates file on disk)
- Delete pages with smart selection (select previous page after deletion)
- Support nested pages with automatic folder conversion

**Navigation:**

- Tree-based sidebar showing all pages hierarchically
- Click to navigate between pages
- Deep-link URLs for direct page access
- Select first page automatically on startup
- **URL structure:** Clean paths without prefix (e.g., `/Welcome`, `/Tasks`, `/Welcome/Markdown%20Guide`)
  - No `/p/` prefix in URLs for cleaner, more intuitive navigation
  - URL-encode spaces and special characters as needed
- **Root URL `/` redirects to first page in sidebar** (e.g., `/Welcome`)
- Handle 404s gracefully when pages don't exist
- **Breadcrumb navigation at the top of the content area**
  - Shows hierarchical path to current page (e.g., "Home > Projects > Website Redesign")
  - Each breadcrumb segment is clickable to navigate to that level
  - Updates dynamically based on current page
- **Back navigation button**
  - Browser-style back button to navigate to previous page
  - Respects navigation history (not just parent page)

**Editing:**

- Plain markdown source editing
- Save functionality with keyboard shortcut
- Real-time preview via viewer component
- Support GitHub-flavored Markdown (GFM) and MDX rendering (disable dynamic imports for security)

**MDX Content Transformation Architecture:**

- **Use rehype plugins exclusively** for transforming paths during compilation
- Transform `<img src>` attributes for image path resolution
- Transform `<a href>` attributes for link path resolution
- **Do NOT use redundant custom components** that transform already-transformed attributes
- Custom `a` component is acceptable ONLY for handling click events (navigation), not path transformation
- Single point of transformation prevents double-processing and maintains clarity
- All path resolution logic should be in rehype plugins or utility functions they call

**Custom Fields:**

- Pages can define custom field schemas for their children via `__schema` in front-matter
- Schema format in parent page:
  ```yaml
  ---
  __schema:
    - name: status
      type: select
      options: [Draft, Review, Published]
    - name: author
      type: text
    - name: date
      type: date
  ---
  ```
- Child pages store field values in their own front-matter:
  ```yaml
  ---
  status: Draft
  author: John Doe
  date: 2025-11-08
  ---
  ```
- Display custom fields in collapsible panel at top of viewer/editor
- Panel collapsed by default, expandable with toggle button
- Fields are editable inline in both view and edit modes
- Field changes auto-save like title changes (immediate)
- Support field types: text, number, date, select (dropdown), checkbox
- **Collapsible panel also displays list of uploaded files (attachments)**
  - Shows all files in page directory except README.md and child page .md files
  - Each file listed with name, size, and download/delete options
  - Clicking filename opens/downloads the file
  - Files can be referenced in markdown using relative paths (e.g., `![pic](./pic.png)`)
  - Upload button to add new files to the page

**File Uploads & Attachments:**

- Pages can have attached files (images, PDFs, any file type)
- **Upload behavior:**
  - User clicks upload button in collapsible panel
  - Selects file(s) from filesystem
  - Files are uploaded to backend and stored in page directory
  - If page is `path/Page.md`, uploading triggers folderization to `path/Page/README.md`
  - Files stored as `path/Page/filename.ext`
- **File listing:**
  - All non-markdown files in page directory shown in collapsible panel
  - Exclude `README.md` and child page `.md` files from listing
  - Display filename, file size, upload date
  - Provide delete action for each file
- **Markdown references and link resolution:**
  - **Image resolution:** Files can be referenced using relative paths: `![image](./pic.png)`
  - Absolute paths from pages root also supported: `![image](/Tasks/screenshot.png)`
  - **Link resolution for .md files:** Links to markdown files navigate within the app
    - `[Task](./Task.md)` → navigates to the Task page in the app
    - `[Guide](./Markdown Guide.md)` → navigates with URL encoding for spaces
    - Path resolution: relative (`./`, `../`) and absolute (`/`) paths supported
    - Strip `.md` extension and navigate using frontend router
  - **Link resolution for other files:** Links to non-.md files open in new browser window
    - `[PDF](./document.pdf)` → opens file via backend API in new tab
    - Add `target="_blank"` and `rel="noopener noreferrer"` for security
  - **External links:** `[Example](https://example.com)` opens in new window
  - **Implementation:** Use rehype plugin during MDX compilation to transform paths
    - Transform `<img src>` for images (already implemented)
    - Transform `<a href>` for links (to implement)
    - Custom `a` component handles click events for in-app navigation
  - **Security:** Use established path traversal prevention library (e.g., `path.resolve()` validation)
  - **Critical:** NEVER allow references outside the configured pages root directory
  - Block attempts to use `../` to escape pages directory
  - Validate all file paths on backend before serving
  - Use library-based validation, not custom regex/string manipulation
  - All path validation must respect the configured `PAGES_ROOT` environment variable

**View Components (MDX):**

- Provide generic MDX components for displaying child pages with custom fields
- All view components automatically query child pages and use parent's schema
- Components are data-agnostic (work with any schema/fields)
- **Page titles in all views are clickable links that navigate to the page**
- Clicking a page in any view (BoardView card, GridView row, ListView item) navigates to that page
- **Each view component displays a refresh icon to manually reload child page data**
- **All view components must be mobile-friendly with responsive layouts**
  - BoardView: horizontal scrolling on mobile, stacked columns
  - GridView: collapse to card layout on mobile, hide less important columns
  - CalendarView: compact mobile calendar view
  - ListView: full-width stacked items on mobile

**Available View Components:**

- `<BoardView>` - Kanban-style board
  - Props: `groupBy` (field name), `filter` (query object), `sort` (field name), `settings` (display options)
  - Groups child pages by specified field value into columns
- `<GridView>` - Table/grid layout
  - Props: `columns` (array of field names), `filter`, `sort`
  - Displays child pages in tabular format with custom field columns
- `<CalendarView>` - Calendar display
  - Props: `dateField` (field name to use for dates), `filter`, `settings`
  - Shows child pages on calendar based on date field
- `<ListView>` - Simple list view
  - Props: `fields` (array of field names to show), `filter`, `sort`
  - Basic list with inline field values
- `<Tabs>` - Tab container for multiple views
  - Wraps multiple views with tab navigation
  - Each `<Tab>` has a `name` prop

**Filter Syntax:**

- Support MongoDB-style query syntax for filters
- Examples: `{ status: { $ne: "Done" } }`, `{ priority: "High" }`, `{ due_date: { $lt: "2025-12-31" } }`

**Usage Example:**

```markdown
# Tasks

<Tabs>
  <Tab name="Board">
    <BoardView 
      groupBy="status" 
      filter={{ status: { $ne: "Done" } }} 
      sort="priority" 
    />
  </Tab>
  
  <Tab name="Active">
    <GridView 
      columns={["status", "priority", "due_date"]}
      filter={{ status: { $ne: "Done" } }}
      sort="due_date"
    />
  </Tab>
  
  <Tab name="Calendar">
    <CalendarView dateField="due_date" />
  </Tab>
</Tabs>
```

## Seed Pages

Include example pages that demonstrate the application features and serve as documentation.

**Purpose:**

- Demonstrate all application features to users
- Serve as living documentation
- **Used as test fixtures for BDD/E2E tests**
- Provide realistic test data for feature development
- When issues found, tests can be written against seed page scenarios

**Seed Page Structure:**

**Welcome Page** (`pages/Welcome.md`):

- Introduction to the markdown editor
- Overview of key features
- Basic navigation instructions
- Link to other example pages

**Markdown Guide** (`pages/Markdown Guide.md`):

- Standard markdown syntax examples (headers, lists, links, images, code blocks)
- MDX-specific features and capabilities
- Formatting best practices
- Examples of view components

**Tasks Example** (`pages/Tasks/README.md`):

Parent page that demonstrates view components with a real schema. Contains:

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

Content with multiple view components:

```markdown
# Tasks

This is a task management workspace demonstrating custom fields and view components.

<Tabs>
  <Tab name="Board">
    <BoardView 
      groupBy="status" 
      filter={{ status: { $ne: "Done" } }} 
      sort="priority" 
    />
  </Tab>
  
  <Tab name="Active">
    <GridView 
      columns={["status", "priority", "due_date"]}
      filter={{ status: { $ne: "Done" } }}
      sort="due_date"
    />
  </Tab>
  
  <Tab name="Calendar">
    <CalendarView dateField="due_date" />
  </Tab>
  
  <Tab name="All">
    <ListView fields={["status", "priority"]} sort="due_date" />
  </Tab>
</Tabs>
```

**Sample Task Pages** (child pages demonstrating the schema):

- `pages/Tasks/Setup Development Environment.md`:

  ```yaml
  ---
  status: Done
  priority: High
  due_date: 2025-11-01
  ---
  ```

  Content: Instructions for setting up the development environment

- `pages/Tasks/Write Tests.md`:

  ```yaml
  ---
  status: In Progress
  priority: High
  due_date: 2025-11-15
  ---
  ```

  Content: List of test cases to implement

- `pages/Tasks/Deploy Application.md`:

  ```yaml
  ---
  status: Todo
  priority: Medium
  due_date: 2025-11-30
  ---
  ```

  Content: Deployment checklist and instructions

- `pages/Tasks/Update Documentation.md`:
  ```yaml
  ---
  status: Todo
  priority: Low
  due_date: 2025-12-15
  ---
  ```
  Content: Documentation sections to update

**Projects Example** (`pages/Projects/README.md`):

Demonstrates different schema and view configuration:

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

```markdown
# Projects

<GridView
columns={["status", "owner", "budget", "start_date"]}
filter={{ status: { $in: ["Planning", "Active"] } }}
sort="start_date"
/>
```

With sample project pages demonstrating various field values.

## Notion-Style Page Creation & Editing UX

**Page Structure:**

- Every page has two distinct editable areas:
  - **Title field** - always at the top, always editable (even in view mode)
  - **Content area** - markdown content below the title
- Title and content are separate concerns:
  - Title changes trigger immediate rename (file on disk)
  - Content changes require explicit save

**Page Creation Flow:**

1. User clicks + button (either root or child)
2. Backend creates page with "Untitled" filename
3. Frontend navigates to new page URL
4. Page view loads with "Untitled" in title field
5. Title field receives automatic focus with text selected
6. User starts typing → immediately replaces "Untitled"
7. Title changes save automatically (rename file on disk)
8. Pressing Enter or clicking in content area → move focus to content

**Title Field Behavior:**

- Displayed at the top of page view (large heading style)
- Always editable without switching to "edit mode"
- Show placeholder text "Untitled" when empty
- Auto-select all text when newly created page loads
- Auto-save on blur or Enter key (triggers rename)
- Validate title to prevent invalid filenames
- No explicit save button needed for title

**Content Editor Behavior:**

- Separate from title (title not part of markdown content)
- Modal editing states: "View" mode shows rendered MDX, "Edit" mode shows markdown source
- Keyboard navigation:
  - From title: Press Enter → focus content editor at start
  - From content: Press arrow-up at start → focus title field at end
  - From content: Press backspace at start when empty → focus title field at end
- Save with Cmd/Ctrl+S or explicit Save button
- Content changes don't affect title, title changes don't affect content

**Inline Editing in Sidebar (Optional Enhancement):**

- When new page created, sidebar can show inline editor in place of page name
- Text pre-selected for immediate typing
- Enter or blur saves and returns to normal tree item
- Escape cancels (keeps "Untitled")
- This provides immediate visual feedback in navigation tree

**Focus Management:**

- New page creation → auto-focus title field with text selected
- After save → remain in current field (don't auto-switch modes)
- After rename → stay on same page, update URL if path changed
- Navigation between pages → preserve last mode (view/edit)

## UI Design Decisions

**Sidebar Layout:**

- Fixed width (e.g., 280px) on desktop, non-shrinking
- Full height with overflow scrolling
- Header with "Pages" label and + button for root page creation
- Hamburger menu (☰) toggle button visible only on mobile

**Tree Navigation:**

- Hierarchical indentation for nested pages
- Each tree item contains:
  - Page title button (clickable, left-aligned, truncates long text)
  - - button for adding child pages (hidden, revealed on hover/focus)

**Visual Design:**

- Selection state: background 5% darker/lighter than base + 2px left border
- Hover state: background 5% darker/lighter than current state
- Stacked hover on selected: another 5% darker/lighter
- Text colors adjust for selected vs unselected states

**Content Area Layout:**

- Breadcrumb navigation at the top
- Back button next to breadcrumbs
- Page title below breadcrumbs
- Custom fields panel (collapsible) below title
- Page content area below custom fields

**Responsive Behavior:**

- Desktop (md breakpoint and up):
  - Sidebar always visible in flexbox layout
  - Hamburger button hidden
  - Sidebar takes fixed width, content area takes flex-1
  - Breadcrumbs display full path
- Mobile (below md breakpoint):
  - Sidebar hidden by default
  - Hamburger button visible in top-left
  - Toggle opens/closes sidebar overlay
  - Sidebar remains open after user actions (doesn't auto-hide)
  - Navigation component has conditional class (hidden/block based on toggle state, md:block always)
  - Breadcrumbs may truncate with ellipsis for long paths

**Interaction Patterns:**

- Notion-like immediate page creation (no modals)
- Both main + button and nested + buttons use identical creation flow
- Show empty state ("Select a page") only when no pages exist
- Auto-select first page on app startup
- After deletion: select previous page in pre-order traversal, or next if first
- Deep linking: URL pattern `/:pagePath` for direct page access (no prefix)

## Development Practices

**Code Quality:**

- Use TypeScript for type safety
- Minimal comments (code should be self-documenting)
- No extensive docstrings (good identifier names suffice)
- Keep explanations brief unless asked

**Project Documentation:**

- Maintain project context file with architecture overview
- Keep README focused on "Start Here" essentials
- Update plan/checklist files as scope changes
- Prefer updating existing docs over creating new ones

## Technical Stack

**Required:**

- **Frontend Framework:** React with Vite build tool
- **E2E Testing:** Playwright with `@cucumber/cucumber` for BDD
- **Language:** TypeScript
- **BDD Tooling:** Gherkin for feature specifications

**Choose appropriate libraries for:**

- Backend HTTP server (lightweight, Node.js-based)
- CSS styling (utility-first framework recommended)
- Zustand for state management
- Client-side routing
- Frontend unit testing
- Markdown Editor, preferably Notion-style
- GitHub-flavored Markdown (GFM) and MDX rendering
- YAML front-matter parsing (for custom fields)
- **File upload handling** (multipart form data parsing)
- **Path traversal prevention** (secure path validation library, e.g., Node.js `path` module with proper validation)

**Monorepo Structure:**

- Use package manager with workspace support
- Separate packages for backend, frontend, and e2e tests
- Shared configuration where appropriate
- Feature files in `packages/e2e/features/`
- Step definitions in `packages/e2e/step-definitions/`

## Success Criteria

The application should:

- Load and display pages from filesystem
- Allow creating/editing/deleting pages via UI
- Automatically organize files based on hierarchy
- Render markdown with extended syntax
- Work on both mobile and desktop with appropriate responsive behavior
- **Pass all tests (unit, component, E2E with Playwright/Cucumber) - NO FAILURES**
- **All BDD feature tests must pass before considering implementation complete**
- Be deployable with configurable storage location
- Support hot reload during development (via Vite)
- Provide smooth, polished UI interactions with proper hover/selection states
- **`npm run dev` should start the application and display seed pages immediately**
- Root URL `/` should redirect to the first page in the sidebar
- Seed pages (Welcome, Markdown Guide, Tasks, Projects) must be visible and functional

**CRITICAL: Before declaring work complete:**

1. **MUST run the full e2e test suite** (`npm run test:e2e` or equivalent)
2. **MUST verify all tests pass** with zero failures
3. **MUST fix any failing tests** before considering the task done
4. **DO NOT skip this step** - running tests is mandatory, not optional
5. If tests fail, debug and fix the issues, then re-run until all pass
