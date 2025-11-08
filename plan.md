# UI improvements

Use TDD - write tests first.

For UI components behavior and formatting - write frontend tests.
For API behavior - write backend tests
For user action flow - use e2e tests

## Selecting pages

- Highlight selected page
- Select first page in the sidebar at startup
- Select previous page if current is deleted
- Show nothing in the page view only if there are no pages

## Page creation flow

- When '+' pressed, page named 'Untitled' is created. In the sidebar in place of its name, editor is created with name selected. So when user types, this page immediately gets renamed. On pressing enter or clicking outside editor - changes are saved
