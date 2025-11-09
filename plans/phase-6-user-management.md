# Phase 6: User Management & Access Control

## Overview

Add authentication and permission-based access control to the application without introducing a database. Use Clerk for authentication and a YAML file for group management.

## Authentication Strategy

### Provider: Clerk

- External authentication provider
- No database required
- JWT-based authentication
- Frontend: `@clerk/clerk-react`
- Backend: `@clerk/backend`

### User Identity

- Users identified by email address from JWT claims
- Backend validates JWT on every request
- Frontend manages token storage and refresh

### Anonymous Access

- Not supported - all users must authenticate
- Unauthenticated requests return 404 for all resources

## Access Control Model

### Groups System

**Groups File:** `config/groups.yml` (stored outside pages directory)

```yaml
groups:
  admins:
    - admin@example.com

  editors:
    - alice@example.com
    - bob@example.com

  managers:
    - boss@example.com

default_permissions:
  editors: [admins]
  readers: [everyone]
```

**Special Virtual Groups:**

- `everyone` - all authenticated users
- `admins` - predefined group with full bypass privileges

### Page Permissions

Pages can specify permissions in frontmatter:

```yaml
---
readers: [everyone]
editors: [editors]
---
```

**Permission Types:**

- `readers` - can view page and its attachments
- `editors` - can edit page, create subpages, upload attachments

**Inheritance Rules:**

- Pages without frontmatter inherit from nearest parent with permissions
- If no parent has permissions, use default_permissions from groups.yml
- Child pages can override parent permissions by specifying their own

**Root Defaults:**

- Applied when no page in hierarchy specifies permissions
- Default: `editors: [admins]`, `readers: [everyone]`

### Permission Resolution Algorithm

1. Check if user is in `admins` group → grant all permissions
2. Load target page
3. Walk up page hierarchy to find first page with readers/editors fields
4. If found, use those permissions
5. If not found, use default_permissions from groups.yml
6. Check if user's groups match required permission

### Operations & Required Permissions

- **Read page:** Must be in `readers` group
- **Edit page:** Must be in `editors` group
- **Create subpage:** Must be in parent's `editors` group
- **Delete page:** Must be in page's `editors` group
- **Rename page:** Must be in page's `editors` group
- **Upload attachment:** Must be in page's `editors` group
- **Delete attachment:** Must be in page's `editors` group
- **Change permissions:** Only `admins` can edit readers/editors fields

### Visibility & Security

**Inaccessible pages are completely invisible:**

- Not shown in navigation tree/sidebar
- Not returned in list API responses
- Not included in parent's children array
- Not shown in breadcrumbs
- Direct URL access returns 404 (not 403)

**Security principle:** If you can't read it, it doesn't exist.

## Use Cases

### Use Case 1: Public Documentation

```yaml
# pages/Documentation/README.md
---
editors: [editors]
readers: [everyone]
---
```

All authenticated users can read, only editors group can modify.

### Use Case 2: Restricted Section

```yaml
# pages/Management/README.md
---
editors: [managers]
readers: [managers]
---
```

Only managers can see and edit this entire section and all subpages.

### Use Case 3: Single Restricted Page

```yaml
# pages/Projects/Public Project.md
# (no frontmatter - inherits: readers: everyone)

# pages/Projects/Confidential Project.md
---
readers: [admins]
editors: [admins]
---
```

One restricted page among public pages - overrides parent permissions.

## Implementation Requirements

### Backend

- Validate JWT on all API requests
- Extract email from JWT claims
- Load and cache groups.yml
- Implement permission checking functions
- Filter list responses based on user permissions
- Return 404 for inaccessible resources
- Admins bypass all permission checks

### Frontend

- Wrap app in Clerk authentication provider
- Require login before showing any content
- Include JWT in all API requests
- Handle 401 responses by redirecting to login
- Handle 404 responses gracefully
- Show/hide UI elements based on current user permissions

### Configuration

- Environment variable for Clerk publishable key (frontend)
- Environment variable for Clerk secret key (backend)
- Environment variable for groups.yml path (default: `config/groups.yml`)
- Groups file must be outside PAGES_ROOT directory

### Performance Considerations

- Cache parsed groups.yml in memory
- Reload groups file on change (file watcher)
- Don't re-parse groups on every request
- Cache permission decisions within a single request context

### Validation

- Validate group names in frontmatter reference existing groups
- Validate readers/editors fields are arrays
- Allow individual emails in addition to group names: `readers: [managers, alice@example.com]`
- Reject invalid frontmatter with clear error messages
- Prevent non-admins from creating pages with permissions they don't have

## Out of Scope

- Audit logging (rely on git commits for now)
- User management UI (edit groups.yml directly)
- Role hierarchy (groups are flat)
- Time-based permissions
- Complex cascading rules
- Team/organization multi-tenancy
- User profiles or preferences

## Testing Requirements

- Unit tests for permission resolution logic
- Unit tests for group loading and caching
- Integration tests for protected API endpoints
- E2E tests for login flow
- E2E tests for permission-based visibility
- E2E tests for 404 on inaccessible pages
- Test admin bypass behavior
- Test inheritance across page hierarchy
