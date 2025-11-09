# Phase 4: Advanced Features & Integration

## Goal

Implement markdown rendering with MDX support, custom fields with front-matter, file uploads/attachments, view components, and seed pages. Complete all remaining features and ensure the entire application passes all tests.

## Prerequisites

- Phases 1, 2, and 3 completed successfully
- Basic page CRUD working end-to-end
- All previous tests passing

## Core Requirements

**Markdown Rendering:**

- Integrate GitHub-flavored Markdown (GFM) rendering library
- Support GFM syntax (headers, lists, links, images, code blocks, tables, task lists, strikethrough, autolinks)
- Support MDX for component embedding
- **Security: Disable dynamic imports in MDX**
- Render markdown in view mode (replaces plain text viewer from Phase 3)

**Custom Fields System:**

**Schema Definition:**
- Parents define child field schemas via `__schema` in front-matter:
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

**Field Storage:**
- Child pages store field values in their front-matter:
  ```yaml
  ---
  status: Todo
  priority: High
  due_date: 2025-11-30
  ---
  ```

**Field UI:**
- Collapsible panel at top of viewer/editor (below title)
- Panel collapsed by default
- Toggle button to expand/collapse
- Fields editable inline in both view and edit modes
- Auto-save on field value change
- Support field types: text, number, date, select, checkbox

**Field Validation:**
- Validate based on schema type
- Select fields limited to defined options
- Date fields use date picker
- Number fields enforce numeric values

**File Uploads & Attachments:**

**Upload Functionality:**
- Upload button in collapsible panel
- Multi-file selection support
- POST to `/api/files/:pagePath` endpoint
- Triggers folderization if page is single .md file
- Files stored in page directory

**File Listing:**
- Display in collapsible panel (same panel as custom fields)
- Show filename, size, upload date
- Exclude README.md and child page .md files from list
- Each file has download and delete actions
- Click filename to download/open file

**Markdown File References:**
- Support relative paths: `![image](./pic.png)`
- Support absolute paths from pages root: `![image](/Tasks/screenshot.png)`
- Backend serves files via `/api/files/:pagePath/:filename`
- Path validation prevents traversal attacks

**MDX View Components:**

Implement generic, data-agnostic view components:

**`<BoardView>` Component:**
- Props: `groupBy`, `filter`, `sort`, `settings`
- Groups child pages by field value into columns
- Kanban-style board layout
- Draggable cards (optional enhancement)
- Mobile: horizontal scroll, stacked columns
- Page titles are clickable links
- Refresh icon to reload data

**`<GridView>` Component:**
- Props: `columns`, `filter`, `sort`
- Table/grid layout with custom field columns
- Sortable columns
- Mobile: collapse to card layout
- Page titles are clickable links
- Refresh icon to reload data

**`<CalendarView>` Component:**
- Props: `dateField`, `filter`, `settings`
- Calendar display based on date field
- Monthly view
- Click date/page to navigate
- Mobile: compact calendar view
- Refresh icon to reload data

**`<ListView>` Component:**
- Props: `fields`, `filter`, `sort`
- Simple list with inline field values
- Mobile: full-width stacked items
- Page titles are clickable links
- Refresh icon to reload data

**`<Tabs>` Component:**
- Wraps multiple views with tab navigation
- Each `<Tab>` has `name` prop
- Mobile-friendly tab bar

**Filter Syntax:**
- MongoDB-style query operators
- Examples: `{ status: { $ne: "Done" } }`, `{ priority: "High" }`
- Operators: `$eq`, `$ne`, `$in`, `$lt`, `$gt`, `$lte`, `$gte`

**View Component Requirements:**
- All components query child pages automatically
- Use parent's `__schema` for field definitions
- Work with any schema (fully generic)
- Responsive design for mobile and desktop
- Loading states while fetching data
- Error handling for missing data

**Seed Pages:**

Create example pages demonstrating all features:

**1. Welcome Page** (`pages/Welcome.md`):
```markdown
# Welcome to Markdown Editor

This is a minimal markdown editor with filesystem storage.

## Features

- Create and organize pages hierarchically
- Edit markdown with live preview
- Custom fields for structured data
- File attachments
- MDX view components

## Getting Started

Check out these example pages:
- [Markdown Guide](/p/Markdown%20Guide) - Learn markdown syntax
- [Tasks](/p/Tasks) - See custom fields and views in action
- [Projects](/p/Projects) - Another example with different schema

Start by exploring the sidebar navigation!
```

**2. Markdown Guide** (`pages/Markdown Guide.md`):
- GitHub-flavored Markdown (GFM) syntax examples
- Headers, lists, links, images, code blocks, tables, task lists, strikethrough
- MDX component examples
- Formatting best practices

**3. Tasks Example** (`pages/Tasks/README.md`):
- Schema with status, priority, due_date fields
- Content with multiple view components in Tabs:
  - BoardView grouped by status
  - GridView with all columns
  - CalendarView by due_date
  - ListView for all tasks
- 4 sample child task pages with various field values

**4. Projects Example** (`pages/Projects/README.md`):
- Schema with status, owner, budget, start_date fields
- GridView showing active projects
- 2-3 sample project pages

**Test Data:**
- Seed pages serve as living documentation
- Used as test fixtures in E2E tests
- Tests copy seed pages to temporary directory
- Tests verify view components render correctly

## Testing Requirements

**E2E Feature Files:**

**`packages/e2e/features/custom-fields.feature`:**
```gherkin
Feature: Custom Fields
  As a user
  I want to add custom fields to my pages
  So that I can store structured data

  Scenario: Define schema in parent page
    Given I create a parent page with a schema
    When I create a child page
    Then the child should have fields matching the schema

  Scenario: Edit custom field values
    Given a page with custom fields
    When I edit a field value in the collapsible panel
    Then the value should auto-save
    And the front-matter should be updated

  Scenario: Select field validation
    Given a page with a select field
    When I edit the field
    Then I should only see the defined options
```

**`packages/e2e/features/file-uploads.feature`:**
```gherkin
Feature: File Uploads and Attachments
  As a user
  I want to attach files to pages
  So that I can store related documents

  Scenario: Upload file to page
    Given I am viewing a page
    When I upload a file via the upload button
    Then the file should appear in the attachments list
    And the file should be stored in the page directory

  Scenario: Download attached file
    Given a page with an attached file
    When I click the filename
    Then the file should download

  Scenario: Delete attached file
    Given a page with an attached file
    When I click the delete button for that file
    Then the file should be removed from the list
    And the file should be deleted from disk

  Scenario: Reference file in markdown
    Given a page with an attached image
    When I reference the image with ![pic](./pic.png)
    Then the image should display in the rendered view
```

**`packages/e2e/features/mdx-views.feature`:**
```gherkin
Feature: MDX View Components
  As a user
  I want to use view components in my pages
  So that I can visualize my data in different ways

  Scenario: BoardView renders child pages
    Given a parent page with a schema
    And child pages with field values
    And BoardView component in the parent content
    When I view the parent page
    Then I should see a board grouped by the specified field
    And each card should show the child page

  Scenario: Click page in view to navigate
    Given a BoardView displaying pages
    When I click a page title in the board
    Then I should navigate to that page

  Scenario: Tabs switch between views
    Given a page with Tabs containing multiple views
    When I click a different tab
    Then I should see that view's content
```

**`packages/e2e/features/dev-environment.feature`:**
```gherkin
Feature: Development Environment
  As a developer
  I want the app to load with seed pages
  So that I can see examples immediately

  Scenario: Running dev server loads seed pages
    When I run "npm run dev"
    And I visit the application
    Then I should see the Welcome page
    And the sidebar should show all seed pages

  Scenario: Seed pages are functional
    Given the dev server is running
    When I navigate to the Tasks page
    Then I should see the BoardView component
    And I should see child task pages
```

**Full Test Suite Run:**

Before declaring Phase 4 complete:
1. Run `npm run test` - all unit tests must pass
2. Run `npm run test:e2e` - all E2E scenarios must pass
3. Fix any failing tests
4. Re-run until all tests pass with zero failures

## Success Criteria

Phase 4 (and entire project) is complete when:

1. **Markdown rendering works:**
   - GitHub-flavored Markdown (GFM) syntax renders correctly (tables, task lists, strikethrough, autolinks)
   - MDX components render (dynamic imports disabled)
   - Code blocks have syntax highlighting

2. **Custom fields work:**
   - Parents define schemas in front-matter
   - Children display editable fields
   - Fields auto-save on change
   - All field types work (text, number, date, select, checkbox)

3. **File uploads work:**
   - Can upload files via UI
   - Files listed in collapsible panel
   - Can download files
   - Can delete files
   - Files referenced in markdown display correctly

4. **View components work:**
   - All 5 view components implemented
   - Components fetch and display child pages
   - Filtering and sorting works
   - Mobile responsive layouts work
   - Page titles are clickable
   - Refresh buttons work

5. **Seed pages exist:**
   - Welcome, Markdown Guide, Tasks, Projects pages created
   - All seed pages have realistic content
   - Tasks and Projects have schemas and child pages

6. **All tests pass:**
   - All unit tests pass
   - All component tests pass
   - **All E2E scenarios pass (CRITICAL)**
   - No test failures anywhere

7. **Dev environment works:**
   - `npm run dev` starts both servers
   - Frontend loads seed pages immediately
   - Root URL redirects to Welcome page
   - All features work in browser

8. **Complete integration:**
   - Backend and frontend fully integrated
   - No console errors
   - Smooth, polished UI
   - All features work together seamlessly

## Deliverables

- GitHub-flavored Markdown (GFM) and MDX rendering implementation
- Custom fields UI and logic
- File upload/download/delete functionality
- All 5 view components (BoardView, GridView, CalendarView, ListView, Tabs)
- Seed pages (Welcome, Markdown Guide, Tasks, Projects)
- Complete E2E test suite covering all features
- All tests passing (unit, component, E2E)
- Working application ready for use

## Final Integration Checklist

Before declaring the project complete:

- [ ] All Phase 1-4 requirements implemented
- [ ] `npm run dev` starts application successfully
- [ ] Seed pages visible and functional
- [ ] Can create, edit, delete pages
- [ ] Custom fields work end-to-end
- [ ] File uploads work end-to-end
- [ ] View components render correctly
- [ ] Responsive design works on mobile and desktop
- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No linter errors
- [ ] No console errors in browser
- [ ] Application is usable and polished

## Notes

- This phase brings all features together
- Focus on integration and testing
- Prioritize test coverage
- Ensure mobile responsiveness for all new features
- View components should be reusable and generic
- Seed pages should be high quality (they're the first thing users see)
- **DO NOT skip the final test run** - this is mandatory

