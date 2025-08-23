# Write mdz from scratch

We are rewriting `../mdz/` from scratch to have real MVP without exta features.

## What to keep

- Language and technology: TypeScript, node, vite, React.
- Tests structure. Backend, Frontend UI, Frontend Behabior and E2E. Preserve structure and approach, not tests themselves.
- backend API
- Page storage strategy. Page is PageName.md or PageName/README.md
- UI style

## What to change

- Page editing - just a md source editing in text editor, no fancy GUI like Novel
- Page view - rendered markdown with MDX support.

## Requirements

- Code style: TDD, DRY, YAGNI. No comments.
- Minimal code. No "legacy support", no imagined use cases - just what required for app to run.
- Minimal tests. Test only that feature works. Then if you find error, reproduce in test first.
- A11y, ARIA, use it for tests.
- Use Storybook for UI Elements design
