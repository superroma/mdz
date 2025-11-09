# Phase 3: Frontend Core & Page Management

## Goal

Build the complete frontend user interface with page navigation, editing, and responsive design. Integrate with the backend API to provide full CRUD functionality for pages.

## Prerequisites

- Phase 1 and 2 completed successfully
- Backend API working and tested
- All backend tests passing

## Core Requirements

**Application Layout:**

Three main component areas:

1. **Sidebar (Navigation):**
   - Fixed width (280px) on desktop
   - Full height with overflow scrolling
   - Header with "Pages" label
   - Root-level + button for creating pages
   - Tree view showing all pages hierarchically
   - Responsive: hidden by default on mobile with hamburger toggle

2. **Content Area:**
   - Breadcrumb navigation at top
   - Back button (browser history)
   - Page title field (always editable)
   - Content viewer/editor below title
   - Takes remaining width (flex-1)

3. **Tree Navigation:**
   - Hierarchical indentation for nested pages
   - Each tree item has:
     - Page title button (clickable, left-aligned)
     - Child + button (visible on hover/focus)
   - Selection state: 5% darker/lighter + 2px left border
   - Hover state: 5% darker/lighter than current
   - Smooth transitions

**Routing & Navigation:**

- Client-side routing with URL pattern `/p/:path`
- Deep linking support for direct page access
- Root URL `/` redirects to first page in sidebar
- Browser back/forward buttons work correctly
- URL updates when navigating between pages
- 404 handling for non-existent pages

**Page Management:**

**Creating Pages:**
1. User clicks + button (root or child)
2. API call creates page with "Untitled" filename
3. Navigate to new page URL
4. Title field auto-focused with text selected
5. User types to rename immediately
6. Title auto-saves on blur/Enter (triggers rename API)

**Editing Pages:**
- Two distinct editable areas: title and content
- Title field:
  - Always editable (even in view mode)
  - Large heading style at top
  - Auto-save on blur/Enter
  - No explicit save button needed
- Content area:
  - Modal states: View mode (rendered) vs Edit mode (markdown source)
  - Toggle between modes with Edit/Preview button
  - Save with Cmd/Ctrl+S or Save button
  - Keyboard navigation:
    - From title: Enter → focus content editor
    - From content: Up arrow at start → focus title
    - From content: Backspace at start when empty → focus title

**Deleting Pages:**
- Delete button/action in UI
- Confirmation prompt
- Smart selection after deletion:
  - Select previous page in pre-order traversal
  - Or next page if deleted page was first
  - Or show empty state if no pages remain

**Renaming Pages:**
- Edit title field
- Auto-save triggers rename API call
- Update URL if path changed
- Update sidebar tree immediately
- Handle rename errors gracefully

**Responsive Design:**

**Desktop (md breakpoint and up):**
- Sidebar always visible in flexbox layout
- Hamburger button hidden
- Sidebar takes fixed width
- Content area takes flex-1
- Full breadcrumb path displayed

**Mobile (below md breakpoint):**
- Sidebar hidden by default
- Hamburger button visible in top-left
- Toggle opens/closes sidebar overlay
- Sidebar stays open after navigation (doesn't auto-hide)
- Breadcrumbs may truncate with ellipsis

**State Management (Zustand):**

- Track current page path
- Track sidebar open/closed state (mobile)
- Track edit mode vs view mode
- Track page list for tree navigation
- Sync state with URL/routing
- Use Zustand store for centralized state management

**API Integration:**

Connect to backend endpoints:
- Fetch page list for sidebar on load
- Fetch page content when navigating
- Create page via POST
- Update page content via PUT
- Rename page via PATCH
- Delete page via DELETE

**Error Handling:**

- Show error messages for API failures
- Handle network errors gracefully
- Show loading states during API calls
- Validate title field (prevent invalid filenames)

## Testing Requirements

**Component Tests:**

Test individual UI components:
- Tree navigation component (selection, expansion)
- Title field component (editing, auto-save)
- Content editor component (view/edit toggle)
- Breadcrumb component (rendering, click navigation)
- Sidebar toggle (mobile behavior)

**E2E Feature Files:**

Create comprehensive BDD scenarios:

**`packages/e2e/features/navigation.feature`:**
```gherkin
Feature: Page Navigation
  As a user
  I want to navigate between pages
  So that I can view different content

  Scenario: Root URL redirects to first page
    When I visit the root URL "/"
    Then I should be redirected to the first page

  Scenario: Navigate via sidebar
    Given I am on a page
    When I click a different page in the sidebar
    Then I should see that page's content
    And the URL should update to match the page path

  Scenario: Deep linking
    When I visit a direct page URL "/p/Tasks/Write Tests"
    Then I should see the "Write Tests" page content
    And the sidebar should highlight that page

  Scenario: Breadcrumb navigation
    Given I am viewing a nested page
    When I click a parent breadcrumb
    Then I should navigate to that parent page

  Scenario: Back button
    Given I have navigated through multiple pages
    When I click the back button
    Then I should return to the previous page
```

**`packages/e2e/features/page-management.feature`:**
```gherkin
Feature: Page Management
  As a user
  I want to create, rename, and delete pages
  So that I can organize my content

  Scenario: Create root page
    When I click the root "+" button
    Then a new page named "Untitled" should be created
    And the title field should be focused with text selected
    And I should be navigated to the new page

  Scenario: Rename page via title field
    Given I am viewing a page
    When I edit the title field and press Enter
    Then the page should be renamed
    And the URL should update if needed
    And the sidebar should show the new name

  Scenario: Create child page
    Given I am viewing a page
    When I click that page's "+" button in the sidebar
    Then a new child page should be created
    And I should be navigated to the new child page

  Scenario: Delete page
    Given I am viewing a page
    When I delete the page
    Then the page should be removed
    And I should be navigated to another page
    And the sidebar should no longer show the deleted page
```

**`packages/e2e/features/responsive.feature`:**
```gherkin
Feature: Responsive Design
  As a mobile user
  I want the interface to adapt to my screen size
  So that I can use the app on any device

  Scenario: Desktop shows sidebar
    Given I am using a desktop screen size
    Then the sidebar should be visible
    And the hamburger button should be hidden

  Scenario: Mobile hides sidebar by default
    Given I am using a mobile screen size
    Then the sidebar should be hidden
    And the hamburger button should be visible

  Scenario: Mobile hamburger toggles sidebar
    Given I am using a mobile screen size
    And the sidebar is hidden
    When I click the hamburger button
    Then the sidebar should become visible
```

**`packages/e2e/features/editing.feature`:**
```gherkin
Feature: Page Editing
  As a user
  I want to edit page content
  So that I can update my notes

  Scenario: Title field auto-saves
    Given I am viewing a page
    When I edit the title field and blur focus
    Then the title should be saved automatically

  Scenario: Switch to edit mode
    Given I am viewing a page in view mode
    When I click the Edit button
    Then I should see the markdown source editor

  Scenario: Save content changes
    Given I am editing a page
    When I modify the content and press Cmd+S
    Then the content should be saved
    And I should see a success indicator

  Scenario: Keyboard navigation from title
    Given the title field is focused
    When I press Enter
    Then the content editor should receive focus
```

## Success Criteria

Phase 3 is complete when:

1. **UI fully functional:**
   - Sidebar displays page tree
   - Can navigate between pages
   - Breadcrumbs work correctly
   - Back button works

2. **Page management works:**
   - Can create root and child pages
   - Can rename pages via title field
   - Can delete pages with smart selection
   - All operations reflected in sidebar immediately

3. **Editing works:**
   - Title field editable and auto-saves
   - Content editor switches between view/edit modes
   - Content saves with Cmd+S or Save button
   - Keyboard navigation between title and content

4. **Responsive design works:**
   - Desktop shows sidebar always
   - Mobile shows/hides sidebar with hamburger
   - Layout adapts to screen size
   - No horizontal scrolling

5. **All component tests pass:**
   - Tree navigation tested
   - Title field tested
   - Editor tested
   - Breadcrumbs tested

6. **All E2E scenarios pass:**
   - Navigation feature scenarios pass
   - Page management scenarios pass
   - Editing scenarios pass
   - Responsive scenarios pass

7. **Manual testing works:**
   - `npm run dev` starts frontend and backend
   - Can create, view, edit, delete pages in browser
   - UI is polished with smooth transitions
   - No console errors

## Deliverables

- Complete frontend implementation
- All UI components built and styled
- Zustand state management integrated
- API client/integration layer
- Component tests (all passing)
- E2E feature files and scenarios (all passing)
- Responsive design working on mobile and desktop

## UI Design Guidelines

**Visual Style:**
- Clean, minimal design (Notion-inspired)
- Consistent spacing and typography
- Smooth transitions for hover/selection states
- Proper focus indicators for accessibility

**Interaction Patterns:**
- Immediate feedback for all actions
- Loading states for async operations
- Clear error messages
- Confirmation for destructive actions (delete)

**Accessibility:**
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management

## Notes

- Use TypeScript for type safety
- Use Zustand for state management
- Use CSS utility framework for styling
- Keep components small and focused
- Prioritize user experience and polish
- Test on both mobile and desktop viewports
- No markdown rendering yet (plain text viewer is fine for now)

