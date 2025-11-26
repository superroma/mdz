---
access:
  readers: [everyone]
  editors: [admins]
---

# Authentication Example

This page demonstrates the new authentication and access control system.

## How It Works

The system uses **JWT-based authentication** with **group-based access control**.

### User Configuration

Users are defined in `pages/.settings/users.yaml`:

```yaml
users:
  "103234567890123456789":  # Google user ID
    name: "Admin User"
    email: "admin@example.com"
    groups:
      - admins
```

### Page Access Control

Pages can specify who can read and edit them in the frontmatter:

```yaml
---
access:
  readers: [everyone]  # All authenticated users
  editors: [admins]    # Only admins
---
```

## Permission Model

- **readers** - Can view the page and its attachments
- **editors** - Can edit, create subpages, upload files, rename, delete
- **admins** - Bypass all checks, have full access to everything

## Special Groups

- **`everyone`** - Matches all authenticated users
- **`admins`** - Full system access

## This Page's Access

This page is configured with:
- **readers: [everyone]** - All authenticated users can read
- **editors: [admins]** - Only admins can edit

## Examples

See the child pages for different access control scenarios:

- **Public Page** - Everyone can read and edit
- **Admin Only** - Only admins can access
- **Custom Groups** - Team-based access

## More Information

See `/workspace/AUTHENTICATION.md` and `/workspace/packages/backend/src/auth/README.md` for complete documentation.
