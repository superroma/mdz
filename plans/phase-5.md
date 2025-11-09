## Link Resolution in MDX Content

### Image Resolution (IMPLEMENTED - Rehype Plugin Only)

**Architecture Decision:** Use rehype plugin ONLY for image path transformation

- Transform `<img src>` attributes during MDX compilation (rehype stage)
- Remove redundant custom `img` component that was causing double transformation
- Single point of transformation for clarity and maintainability

**Image Resolution Rules:**

- `![Logo](./logo.png)` → resolves relative to current page directory
- `![Logo](logo.png)` → resolves relative to current page directory (same as ./)
- `![Logo](../logo.png)` → resolves relative to parent directory
- `![Logo](/Welcome/logo.png)` → absolute path from pages root
- `![Logo](https://example.com/logo.png)` → external URLs passed through unchanged

### Link Resolution (TO IMPLEMENT)

**Requirements:**

1. **Markdown (.md) file links** → navigate to page in the app

   - `[Tasks](./Tasks/README.md)` → navigate to `/Tasks` page
   - `[Guide](./Markdown Guide.md)` → navigate to `/Markdown%20Guide` page
   - `[Project](../Projects/Website.md)` → navigate to `/Projects/Website` page
   - Path resolution follows same rules as images (relative, absolute, parent navigation)
   - Strip `.md` extension and navigate using frontend router
   - URL-encode paths for spaces and special characters

2. **Non-.md file links** → open in new browser window

   - `[PDF](./document.pdf)` → open `http://localhost:3001/api/files/path/document.pdf` in new tab
   - `[Image](./screenshot.png)` → open file URL in new tab
   - Add `target="_blank"` and `rel="noopener noreferrer"` for security

3. **External links** → open in new window (standard behavior)
   - `[Example](https://example.com)` → open in new tab with security attributes

**Implementation Approach:**

- Use rehype plugin to transform `<a href>` attributes during compilation
- Detect .md links and convert to frontend navigation paths
- Detect file links and convert to backend file URLs
- Use `useNavigate` hook passed via component context for in-app navigation
- Custom `a` component in `createMdxComponents` to handle click events

**Testing Requirements:**

- Unit tests for link resolution logic (similar to existing image tests)
- E2E tests for link navigation behavior
- Test URL encoding for spaces and special characters
- Test relative path resolution (same dir, parent dir, absolute)
- Test external links open in new window

## Frontend Routing Cleanup

**Remove `/p/` prefix from all navigation paths:**

- Current: `/p/Welcome`, `/p/Tasks`, `/p/Welcome/Markdown%20Guide`
- New: `/Welcome`, `/Tasks`, `/Welcome/Markdown%20Guide`
- Update all navigation code: `navigate(\`/p/\${path}\`)`→`navigate(\`/\${path}\`)`
- Update route definitions: `<Route path="/p/*">` → `<Route path="/:pagePath">`
- Update breadcrumbs, tree navigation, and all other navigation components
- Update seed page links that currently use `/p/` prefix
- Cleaner URLs, more intuitive for users

**Testing:**

- Unit tests for navigation helpers
- E2E tests for all navigation flows with new URL structure
- Test deep linking with new paths
- Test browser back/forward navigation

## Attachments

- Hidden files should be ignored
- MIME types should be supported
- Dangerous files should be restricted. Suggest a whitelist of file extensions

## Custom fields

- MD source edit should edit the whole file including frontmatter
- If page has frontmatter - there should be custom fields panel visible that shows these fields
- If parent page hase \_\_schema in the frontmatter - then it should be used format fields and editor properly. If not
  then all fields should be shown and editable as text.
- When creating new page - if parent page has \_\_schema - then frontmatter should be created with these fields and empty values.
- Custom Fields panel in the document should have title "Fields" and be collapsible, and collapsed state should persist (across app, not per page)
- complex fields (like \_\_schema itself) should be shown somehow in compact way with tooltip with content.
- Date field should be formatted in local date time

Page name should be MDZ - Current Page Title

## Test production run, test on mobile
