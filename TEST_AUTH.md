# Test Authentication Provider

## Overview

The test authentication provider allows you to quickly log in as different test users during development without needing real OAuth providers.

## Features

- **Development Only**: Automatically excluded from production builds
- **Multiple Roles**: Pre-configured admin, writer, and reader users
- **Shared Configuration**: Single source of truth for test users used by both dev auth and E2E tests
- **Simple UI**: Minimal HTML page for selecting which user to log in as

## Usage

### During Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`

3. Click on "Continue with Test (Dev Only)" on the login page

4. Select which user you want to log in as:
   - **Test Admin** (admin@test.local)
   - **Test Writer** (writer@test.local)
   - **Test Reader** (reader@test.local)

### In E2E Tests

The E2E tests automatically use the same test user definitions:

```gherkin
Given I am logged in as "admin@test.local"
```

## Adding New Roles

To add a new test role (e.g., "moderator"), update **two files** with identical definitions:

### 1. Backend: `packages/backend/src/dev/test-users.ts`

```typescript
export const TEST_USERS: Record<string, TestUser> = {
  admin: { /* ... */ },
  writer: { /* ... */ },
  reader: { /* ... */ },
  moderator: {
    id: "test-moderator",
    email: "moderator@test.local",
    name: "Test Moderator",
    roles: ["moderator"],
  },
};
```

### 2. E2E: `packages/e2e/support/test-users.ts`

```typescript
export const TEST_USERS: Record<string, TestUser> = {
  admin: { /* ... */ },
  writer: { /* ... */ },
  reader: { /* ... */ },
  moderator: {
    id: "test-moderator",
    email: "moderator@test.local",
    name: "Test Moderator",
    roles: ["moderator"],
  },
};
```

The new role will automatically appear:
- On the test auth selection page (`/api/dev-auth/select`)
- As a valid user in E2E tests

## Implementation Details

### Files

- **`packages/backend/src/dev/test-users.ts`**: Backend test user definitions and JWT generation
- **`packages/backend/src/dev/test-auth-plugin.ts`**: Fastify plugin that provides the test auth routes
- **`packages/backend/src/server.ts`**: Conditionally registers the plugin in development
- **`packages/backend/src/routes/auth.ts`**: Adds test provider to the providers list
- **`packages/e2e/support/test-users.ts`**: E2E test user definitions (kept in sync with backend)
- **`packages/e2e/support/hooks.ts`**: Generates JWTs for E2E tests
- **`packages/e2e/step-definitions/auth.steps.ts`**: Cucumber step for logging in as test users
- **`packages/frontend/src/components/LoginPage.tsx`**: Displays the test provider button

### Routes

- **`GET /api/dev-auth/select`**: Displays HTML page with user selection buttons
- **`GET /api/dev-auth/login/:role`**: Generates JWT and redirects to frontend with token

### Security

The test auth provider is:
- Only registered in the dev-server.ts entrypoint!
- Only available in development builds
- Automatically excluded from production builds via conditional imports
