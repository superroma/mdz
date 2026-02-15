# Access Control

MDZ supports group-based access control for pages. When no configuration exists, all pages are readable and writable by everyone.

## Configuration File

Access control is configured in `pages/.settings/users.yaml`:

```yaml
defaultAccess:
  read: [everyone]
  write: [writers]

users:
  alice@example.com:
    groups: [admins]
  bob@example.com:
    groups: [writers, team-a]
  carol@example.com:
    groups: []
```

### defaultAccess

Sets the default read/write permissions for all pages. Each is a list of group names.

### users

Maps user emails to their groups. Users authenticate via OAuth (Google, Yandex, etc.) and their email is matched against this list.

- A user listed in `users` automatically gets the `everyone` group
- A user **not** listed in `users` gets no groups and cannot access anything
- The `admins` group bypasses all access checks (full read/write everywhere)

## Per-Page Access

Override access for a specific page by adding `__access` to its front-matter:

```yaml
---
__access:
  read: [team-a]
  write: [team-a]
---
```

This restricts both reading and writing to members of `team-a` (and admins).

You can set read and write separately:

```yaml
---
__access:
  read: [everyone]
  write: [admins]
---
```

If you specify only one of `read` or `write`, the other falls back to what the page would have without `__access` (from parent or `defaultAccess`):

```yaml
---
__access:
  read: [team-a]
---
```

This restricts reading to `team-a`, but writing stays whatever the page would normally inherit.

## Access Inheritance

Child pages inherit access from their parent. If a parent page has `__access`, all children under it follow the same rules unless they define their own `__access`.

For example, if `Projects/README.md` has:

```yaml
---
__access:
  read: [team-a]
  write: [team-a]
---
```

Then `Projects/Website Redesign.md` also requires `team-a` access, unless it sets its own `__access`.

## Special Groups

| Group | Meaning |
|-------|---------|
| `everyone` | Automatically assigned to all known users |
| `admins` | Full access to all pages, bypasses all checks |

## No Configuration

When `pages/.settings/users.yaml` does not exist, MDZ runs in open mode: all pages are readable and writable by everyone without authentication.

## Example

A typical setup with public docs, restricted team pages, and admin-only settings:

```yaml
defaultAccess:
  read: [everyone]
  write: [writers]

users:
  alice@example.com:
    groups: [admins]
  bob@example.com:
    groups: [writers, engineering]
  carol@example.com:
    groups: [writers, design]
  dave@example.com:
    groups: []
```

Then restrict specific pages:

```yaml
---
__access:
  read: [engineering]
  write: [engineering]
---
```

- **alice** can read and write everything (admin)
- **bob** can read all pages, write public pages, and access engineering-restricted pages
- **carol** can read all pages, write public pages, and access design-restricted pages
- **dave** can read public pages but cannot write anything
