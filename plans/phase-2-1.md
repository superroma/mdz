# Phase 2.1: Backend Improvements & Enhancements

## Current State

The oQmch implementation has been selected as the base for Phase 2 due to its:
- ✅ Excellent modular architecture (best separation of concerns)
- ✅ Complete E2E test coverage (7/7 scenarios passing)
- ✅ 22 unit tests passing
- ✅ Clean route separation
- ✅ Dedicated folderization module
- ✅ Path security validation

## Goal

Enhance the current oQmch implementation by integrating the best features from POD95 and Em9VW implementations to achieve a production-ready, highly maintainable backend with comprehensive test coverage and bulletproof error handling.

## Improvements to Implement

### Priority 1: Critical Enhancements (Implement First)

#### 1. Custom Error Classes (from POD95)

**Current State:** oQmch uses generic `Error` with string checking in routes
**Target:** Structured error hierarchy with HTTP status codes

Create `packages/backend/src/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}
```

**Benefits:**
- No more manual status code checking in routes
- Type-safe error handling
- Single source of truth for HTTP status codes
- Cleaner route handlers

#### 2. Centralized Error Handler (from POD95)

**Current State:** Every route has try-catch with manual error handling
**Target:** Single error handler for entire application

Add to `packages/backend/src/server.ts`:

```typescript
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ error: error.message });
    return;
  }

  request.log.error(error);
  reply.status(500).send({ error: "Internal Server Error" });
});
```

**Benefits:**
- DRY principle - no repetitive error handling in routes
- Consistent error response format
- Centralized logging for unexpected errors
- Routes can throw errors and handler manages responses

#### 3. Replace Manual CORS with Plugin (from Em9VW)

**Current State:** Manual CORS headers in onRequest hooks
**Target:** Use official `@fastify/cors` plugin

In `packages/backend/src/server.ts`:

```typescript
import cors from "@fastify/cors";

// Replace manual CORS hooks with:
await app.register(cors, {
  origin: true,
  credentials: true
});
```

**Benefits:**
- More reliable and feature-complete
- Handles OPTIONS requests properly
- Better browser compatibility
- Less code to maintain

#### 4. Update Storage Layer to Use Custom Errors

**Current State:** Storage functions throw generic `Error`
**Target:** Use custom error classes

Update these files to throw appropriate errors:
- `packages/backend/src/storage/page-storage.ts`
- `packages/backend/src/storage/file-storage.ts`
- `packages/backend/src/storage/path-validator.ts`

Changes:
- Throw `NotFoundError` when pages/files don't exist
- Throw `ValidationError` for invalid inputs
- Throw `ForbiddenError` for path traversal attempts

Example:
```typescript
// OLD
if (!pageExists) {
  throw new Error("Page not found");
}

// NEW
if (!pageExists) {
  throw new NotFoundError("Page not found");
}
```

#### 5. Simplify Route Handlers

**Current State:** Routes have verbose try-catch blocks
**Target:** Let error handler manage errors

Example transformation:
```typescript
// OLD
app.get("/api/pages/*", async (request, reply) => {
  try {
    const path = (request.params as { "*": string })["*"];
    const validation = validatePath(path);
    
    if (!validation.valid) {
      return reply.code(403).send({ error: validation.error || "Invalid path" });
    }
    
    const page = readPage(path);
    
    if (!page) {
      return reply.code(404).send({ error: "Page not found" });
    }
    
    return reply.code(200).send(page);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to read page" });
  }
});

// NEW
app.get("/api/pages/*", async (request) => {
  const path = (request.params as { "*": string })["*"];
  validatePath(path); // Throws ForbiddenError if invalid
  const page = readPage(path); // Throws NotFoundError if not found
  return page;
});
```

### Priority 2: Enhanced Testing

#### 6. Comprehensive Server Tests (from POD95)

**Current State:** 1 basic server test
**Target:** 10+ comprehensive integration tests

Add to `packages/backend/tests/server.test.ts`:

Tests should cover:
- ✅ Health endpoint
- ✅ List pages with hierarchy
- ✅ Read page with front-matter
- ✅ Create root page
- ✅ Create child page (triggers folderization)
- ✅ Update page content
- ✅ Rename page
- ✅ Delete page
- ✅ Path traversal prevention (403 response)
- ✅ File upload
- ✅ File download
- ✅ File deletion

Each test should:
- Use temporary test directory
- Use seed pages as fixtures
- Verify filesystem changes
- Verify API response format

#### 7. Request-Level Path Traversal Detection (from POD95)

**Current State:** Path validation only in individual routes
**Target:** Early detection at Fastify level

Add to `packages/backend/src/server.ts`:

```typescript
type TraversalFlaggedRequest = {
  __hasTraversal?: boolean;
  __invalidEncoding?: boolean;
};

export async function buildServer() {
  const app = fastify({
    rewriteUrl: (req) => {
      const rawUrl = req.url ?? "";
      try {
        const decoded = decodeURIComponent(rawUrl);
        const pathOnly = decoded.split("?")[0] ?? "";
        const segments = pathOnly.split("/").filter(Boolean);
        if (segments.includes("..")) {
          (req as TraversalFlaggedRequest).__hasTraversal = true;
        }
      } catch {
        (req as TraversalFlaggedRequest).__invalidEncoding = true;
      }
      return req.url ?? rawUrl;
    }
  });

  // Add early rejection hook
  app.addHook("onRequest", (request, reply, done) => {
    const raw = request.raw as TraversalFlaggedRequest & { url?: string };
    if (!raw.url || !raw.url.startsWith("/api/")) {
      done();
      return;
    }

    if (raw.__invalidEncoding) {
      reply.status(400).send({ error: "Invalid URL encoding" });
      return;
    }

    if (raw.__hasTraversal) {
      reply.status(403).send({ error: "Path traversal attempt detected" });
      return;
    }

    done();
  });
}
```

**Benefits:**
- Defense in depth - two layers of security
- Catches attacks before route handlers
- Consistent security across all endpoints

#### 8. Markdown Parsing Tests (from Em9VW)

**Current State:** No dedicated front-matter parsing tests
**Target:** Comprehensive front-matter test suite

Create `packages/backend/tests/storage/front-matter.test.ts`:

Tests should cover:
- ✅ Parse content without front-matter
- ✅ Parse valid YAML front-matter
- ✅ Handle empty front-matter
- ✅ Serialize content without front-matter
- ✅ Serialize with front-matter
- ✅ Handle empty front-matter object

#### 9. Enhanced Path Validation Tests (from Em9VW)

**Current State:** 6 path validation tests
**Target:** 10+ edge case tests

Add to `packages/backend/tests/storage/path-validator.test.ts`:

Additional tests:
- ✅ Title extraction from various path formats
- ✅ Filename sanitization with special characters
- ✅ Mixed traversal attempts (valid/../../../etc/passwd)
- ✅ Absolute paths outside root
- ✅ Unicode characters in paths
- ✅ Empty path segments

### Priority 3: Code Quality Improvements

#### 10. Convert Synchronous Operations to Async (from Em9VW)

**Current State:** Many fs operations are synchronous
**Target:** All I/O operations async

Files to update:
- `packages/backend/src/storage/page-storage.ts`
- `packages/backend/src/storage/file-storage.ts`
- `packages/backend/src/storage/folderization.ts`

Replace:
- `fs.readFileSync()` → `fs.readFile()`
- `fs.writeFileSync()` → `fs.writeFile()`
- `fs.readdirSync()` → `fs.readdir()`
- `fs.existsSync()` → `fs.access()`
- `fs.statSync()` → `fs.stat()`

**Benefits:**
- Non-blocking I/O
- Better scalability
- Modern Node.js best practices

#### 11. Improve Seed Page Documentation (from Em9VW)

**Current State:** Basic seed pages
**Target:** Better explanations and structure

Update `pages/Tasks/README.md`:
- Add section explaining custom fields
- Add "Task Views" section header
- Add "Adding Tasks" instructions
- More descriptive content

### Priority 4: Additional Package Dependencies

Add to `packages/backend/package.json`:

```json
{
  "dependencies": {
    "@fastify/cors": "^9.0.1"
  }
}
```

## Implementation Steps

### Step 1: Error Handling System
1. Create `src/errors.ts` with custom error classes
2. Add centralized error handler to `src/server.ts`
3. Update storage modules to throw custom errors
4. Refactor route handlers to use error handler

### Step 2: CORS & Security
1. Install `@fastify/cors`
2. Replace manual CORS with plugin
3. Add request-level path traversal detection

### Step 3: Enhanced Testing
1. Add comprehensive server tests (10+ tests)
2. Add markdown/front-matter tests
3. Add additional path validation tests
4. Ensure all tests pass

### Step 4: Code Quality
1. Convert sync operations to async
2. Update seed page documentation
3. Run linter and fix any issues

### Step 5: Verification
1. Run all unit tests: `npm test`
2. Run all E2E tests: `npm run test:e2e`
3. Verify test count increased from 22 to 40+
4. Manual API testing with curl

## Success Criteria

Phase 2.1 is complete when:

1. **Error Handling:**
   - ✅ Custom error classes implemented
   - ✅ Centralized error handler working
   - ✅ All routes simplified (no manual error handling)
   - ✅ Consistent error responses across all endpoints

2. **Security:**
   - ✅ @fastify/cors plugin integrated
   - ✅ Request-level path traversal detection
   - ✅ Two layers of security validation

3. **Testing:**
   - ✅ 40+ unit tests passing (up from 22)
   - ✅ 10+ comprehensive server integration tests
   - ✅ Front-matter parsing tests
   - ✅ All E2E tests still passing (7/7 scenarios)

4. **Code Quality:**
   - ✅ All I/O operations async
   - ✅ No linter errors
   - ✅ Better seed page documentation
   - ✅ Type safety maintained throughout

5. **Manual Verification:**
   - ✅ All CRUD operations work via curl/Postman
   - ✅ Path traversal attempts blocked
   - ✅ Error responses consistent and helpful
   - ✅ CORS working for browser requests

## Expected Outcomes

**Before (oQmch base):**
- 22 unit tests
- 1 basic server test
- Manual error handling in routes
- Manual CORS headers
- Sync file operations
- Good architecture

**After (Phase 2.1 complete):**
- 40+ unit tests
- 10+ server integration tests
- Automatic error handling
- Plugin-based CORS
- Async file operations
- Excellent architecture with defense in depth

**Test Coverage Breakdown:**
- Server tests: 1 → 10+ (integration tests)
- Storage tests: ~15 → ~20 (more edge cases)
- Path validation: 6 → 10+ (more security tests)
- Front-matter: 5 → 8 (comprehensive parsing tests)
- **Total: 22 → 40+ tests**

## Notes

- **Maintain backward compatibility:** API contracts should not change
- **Keep modular structure:** Don't merge files, maintain separation
- **Preserve E2E tests:** Ensure all 7 scenarios still pass
- **Document breaking changes:** If any, note them clearly
- **Test incrementally:** Run tests after each major change

## References

- POD95 implementation: `/Users/eremin/.cursor/worktrees/mdz2/POD95`
- Em9VW implementation: `/Users/eremin/.cursor/worktrees/mdz2/Em9VW`
- Current oQmch base: `/Users/eremin/work/try/mdz2/packages/backend`

## Timeline Estimate

- Priority 1 (Critical): 2-3 hours
- Priority 2 (Testing): 2-3 hours
- Priority 3 (Quality): 1-2 hours
- Priority 4 (Dependencies): 15 minutes
- **Total: 5-8 hours of focused development**

---

**Remember:** The goal is to combine the best features from all three implementations while maintaining oQmch's excellent architecture. Focus on incremental improvements with tests passing at each stage.

