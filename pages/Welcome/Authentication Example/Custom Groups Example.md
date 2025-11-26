---
access:
  readers: [editors, reviewers]
  editors: [editors]
---

# Custom Groups Example

This page demonstrates access control with custom groups.

## Configuration

In this example:
- **readers: [editors, reviewers]** - Both editors and reviewers can view
- **editors: [editors]** - Only editors can modify

## How to Use

1. Define your groups in `pages/.settings/users.yaml`:

```yaml
users:
  "user-id-1":
    name: "Editor User"
    groups:
      - editors
  
  "user-id-2":
    name: "Reviewer User"
    groups:
      - reviewers
```

2. Reference those groups in page frontmatter
3. Users inherit the appropriate permissions

## Flexibility

You can create any groups you need:
- `engineering`, `design`, `marketing`
- `managers`, `employees`, `contractors`
- `read-only`, `contributors`, `maintainers`

The system is completely flexible!
