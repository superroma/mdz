# Public Page

This page uses the default access settings, which allow everyone to read and only admins to edit.

No `access` field is specified in the frontmatter, so it inherits from the parent or uses the default:

```yaml
default_access:
  readers: [everyone]
  editors: [admins]
```

Everyone who is authenticated can see this page, but only admins can modify it.
