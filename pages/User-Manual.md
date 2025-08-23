# MDZ User Manual

## What is this?

Minimal markdown editor/viewer backed by a filesystem folder `./pages`.

## Basic usage

- Run dev servers:
  - `pnpm -C app/backend dev`
  - `pnpm -C app/frontend dev`
- Open http://localhost:5173
- Use Sidebar to open a page
- Edit in Editor mode; Save to persist

## Files

- Pages are `PageName.md` or `PageName/README.md`
- Title = filename or directory name
- Metadata is JSON front-matter between `---` lines

## Git workflow

- Commit `./pages` to sync/share
- Resolve conflicts manually if they occur

## Some additions
