# Authentication and Access Control

This directory contains the authentication and authorization system for the markdown editor.

## Overview

The system provides:
- **JWT-based authentication** with Google OAuth support
- **Group-based access control** with flexible permission inheritance
- **Pages as source of truth** - user configuration stored in `pages/.settings/users.yaml`
- **Two permission levels**: readers (view) and editors (modify)
- **Admin bypass** - admins have full access to everything
- **Inheritance** - child pages inherit parent permissions

## Architecture

### Components

1. **user-manager.ts** - Loads and caches user configuration, manages group memberships
2. **jwt-middleware.ts** - Authenticates JWT tokens and attaches user to requests
3. **permissions.ts** - Checks and enforces access permissions with inheritance

### User Configuration

Users are defined in `pages/.settings/users.yaml`:

```yaml
users:
  "103234567890123456789":  # Google user ID from JWT 'sub' claim
    name: "Admin User"
    email: "admin@example.com"
    groups:
      - admins

  "103234567890123456790":
    name: "Editor User"
    email: "editor@example.com"
    groups:
      - editors

group_descriptions:
  admins: "Full access to all pages - bypasses all permission checks"
  editors: "Can edit and manage content"
  readers: "Read-only access"

default_access:
  readers: [everyone]  # All authenticated users can read by default
  editors: [admins]    # Only admins can edit by default
```

### Page Access Control

Pages specify access in frontmatter:

```yaml
---
title: "Confidential Document"
access:
  readers: [admins, managers]  # Who can view
  editors: [admins]             # Who can edit
---

# Document content here
```

Access lists can contain:
- **Group names**: `admins`, `editors`, `everyone`
- **Individual user IDs**: `103234567890123456789`
- **Individual emails**: `admin@example.com`

### Special Groups

- **`admins`** - Bypasses all permission checks, full access
- **`everyone`** - Matches all authenticated users (virtual group)

## Permission Model

### Permission Types

1. **read** - View page content and attachments
2. **write** - Edit page, create subpages, upload/delete attachments, rename, delete

### Permission Resolution

For each page access check:

1. **Admin bypass** - If user is in `admins` group → grant access
2. **Page-specific** - Check if page has `access` in frontmatter → use it
3. **Inheritance** - Walk up parent hierarchy to find `access` config → use first found
4. **Default fallback** - Use `default_access` from users.yaml

### Inheritance Example

```
pages/
  Projects/                    # access: { readers: [editors], editors: [editors] }
    README.md
    Public Project/            # (inherits from Projects)
      README.md
    Secret Project/            # access: { readers: [admins], editors: [admins] }
      README.md
```

- `Projects` - only editors can read/write
- `Public Project` - inherits, so only editors can read/write  
- `Secret Project` - overrides parent, only admins can read/write

### Visibility Rules

Pages without read permission are **completely invisible**:
- Not shown in navigation/sidebar
- Not returned in `/api/pages` list
- Not included in parent's children array
- Direct access returns `404` (not `403`)

**Security principle**: If you can't read it, it doesn't exist.

## JWT Authentication

### Google OAuth JWT Structure

```javascript
{
  "sub": "103234567890123456789",  // Google user ID (primary identifier)
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "iss": "https://accounts.google.com",
  "aud": "your-client-id.apps.googleusercontent.com",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### JWT Verification

The middleware supports two modes:

1. **Production** (with `JWT_SECRET` env var):
   ```bash
   JWT_SECRET=your-secret-key npm start
   ```
   Verifies JWT signature using the secret.

2. **Development** (no `JWT_SECRET`):
   ```bash
   npm run dev
   ```
   Decodes JWT without verification (INSECURE - only for testing).

### Testing Without JWT

For E2E tests and development:

```bash
DISABLE_AUTH=true npm run dev
```

This bypasses authentication and uses a default admin user. Optionally specify:

```bash
DISABLE_AUTH=true TEST_USER_ID=103234567890123456789 npm run dev
```

## API Routes

All `/api/*` routes require authentication:

### Pages

- `GET /api/pages` - List accessible pages (filtered by permissions)
- `GET /api/pages/:path` - Get page (requires read permission)
- `POST /api/pages` - Create page (requires write permission on parent)
- `PUT /api/pages/:path` - Update page (requires write permission)
- `PATCH /api/pages/:path` - Rename page (requires write permission)
- `DELETE /api/pages/:path` - Delete page (requires write permission)

### Files

- `GET /api/files/:pagePath` - List files (requires read permission on page)
- `GET /api/files/:pagePath/:filename` - Download file (requires read permission)
- `POST /api/files/:pagePath` - Upload file (requires write permission)
- `DELETE /api/files/:pagePath/:filename` - Delete file (requires write permission)

### Error Responses

- `404` - Page not found OR no permission (security by obscurity)
- `400` - Invalid request
- `500` - Server error

## Usage Examples

### Example 1: Public Documentation with Protected Admin Section

```yaml
# pages/Docs/README.md
---
access:
  readers: [everyone]
  editors: [editors]
---
# Public Documentation
```

```yaml
# pages/Docs/Admin/README.md
---
access:
  readers: [admins]
  editors: [admins]
---
# Admin-Only Documentation
```

Result:
- All users can read `Docs/*`
- Only admins can read `Docs/Admin/*`
- Only editors can edit `Docs/*`
- Only admins can edit `Docs/Admin/*`

### Example 2: Team Workspace

```yaml
# pages/Teams/Engineering/README.md
---
access:
  readers: [engineers, managers]
  editors: [engineers]
---
# Engineering Team
```

Result:
- Engineers and managers can read
- Only engineers can edit
- All subpages inherit these permissions

### Example 3: Personal Page with Individual Access

```yaml
# pages/Projects/Secret Project/README.md
---
access:
  readers: [admins, user-specific-id-123, alice@example.com]
  editors: [user-specific-id-123]
---
# My Secret Project
```

Result:
- Only admins, specific user, and alice@example.com can read
- Only the specific user can edit

## Security Considerations

### Best Practices

1. **Always use JWT_SECRET in production** - Never deploy without signature verification
2. **Use HTTPS** - JWT tokens must be transmitted over secure connections
3. **Short token expiry** - Configure short JWT expiration times (e.g., 1 hour)
4. **Least privilege** - Grant minimum required permissions
5. **Regular audits** - Review users.yaml periodically
6. **Admin group protection** - Limit admin group membership

### Attack Vectors

1. **Token theft** - Mitigated by HTTPS and short expiry
2. **Privilege escalation** - Prevented by immutable JWT claims
3. **Information disclosure** - Prevented by 404 responses (not 403)
4. **Path traversal** - Prevented by path validation middleware

## Configuration

### Environment Variables

```bash
# Required for production
JWT_SECRET=your-jwt-secret-key

# Optional - pages root directory (defaults to ./pages)
PAGES_ROOT=/path/to/pages

# Development/testing only
DISABLE_AUTH=true
TEST_USER_ID=103234567890123456789
```

### File Watching

The user manager automatically reloads `users.yaml` when it changes, enabling:
- Add/remove users without restart
- Update group memberships in real-time
- Change default access policies on the fly

## Testing

### Unit Tests

```bash
npm test -- tests/auth
```

Tests cover:
- User loading and caching
- Group membership checks
- Permission resolution
- Inheritance logic
- Admin bypass
- Edge cases

### E2E Tests

```bash
npm run test:e2e -- features/authentication.feature
```

Tests cover:
- Unauthenticated access denial
- Admin full access
- Permission-based filtering
- Inheritance scenarios
- File operation permissions

## Migration Guide

### Adding Authentication to Existing Instance

1. **Create users.yaml**:
   ```bash
   mkdir -p pages/.settings
   cp examples/users.yaml pages/.settings/users.yaml
   ```

2. **Add at least one admin**:
   - Get your Google user ID from JWT after first login
   - Add to `users.yaml` in `admins` group

3. **Set JWT_SECRET**:
   ```bash
   export JWT_SECRET=your-secret-key
   ```

4. **Start server**:
   ```bash
   npm start
   ```

5. **All existing pages use default access** (readers: everyone, editors: admins)

6. **Gradually add page-specific access** as needed

## Troubleshooting

### "Not Found" for pages that exist

- Check user has `admins` group OR
- Check page's effective access rights
- Verify user's group memberships

### Users not loading

- Check `pages/.settings/users.yaml` exists
- Verify YAML syntax is valid
- Check server logs for parsing errors

### JWT verification failing

- Verify `JWT_SECRET` is set correctly
- Check JWT is not expired
- Ensure JWT is properly signed

### File watching not working

- Some filesystems don't support inotify
- Restart server to reload users
- Check file permissions

## Future Enhancements

Potential improvements (not yet implemented):

- [ ] Audit logging (use git commits for now)
- [ ] User management UI (edit users.yaml directly)
- [ ] Role hierarchies (groups are flat)
- [ ] Time-based permissions
- [ ] More granular permissions (create, delete, rename separately)
- [ ] Team/organization multi-tenancy
- [ ] OAuth provider abstraction (support more than Google)
