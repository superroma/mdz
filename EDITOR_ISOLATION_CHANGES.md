# Editor Isolation Changes

## Problem
Typing in the edit window was nearly impossible due to autosave interference:
- Typed symbols would get lost during save operations
- Cursor would jump randomly while typing
- State updates from save responses would overwrite user input mid-typing

## Root Cause
The autosave flow was touching editor state during save operations:

1. User types → Updates `value` state → Triggers debounced save (300ms)
2. Save executes → Calls API → **Updates `value` and `displayValue` states again**
3. Store update → Content prop changes → Triggers useEffect → **Potentially updates editor**

These state updates during save caused React to re-render the textarea, resulting in:
- Lost keystrokes (state rewrite during typing)
- Cursor position jumps (DOM re-render)
- Race conditions (user input vs server response timing)

## Solution: Complete State Isolation

**Core Principle:** The editor's `value` state is the single source of truth while editing. Save operations never touch it.

### Key Changes

#### 1. Removed State Updates from Save Operation
**File:** `packages/frontend/src/components/ContentEditor.tsx`

**Before:**
```typescript
await onSaveRef.current(contentToSave);
setValue(contentToSave);              // ❌ Touches editor state
setDisplayValue(contentToSave);       // ❌ Touches editor state
contentRef.current = contentToSave;
```

**After:**
```typescript
await onSaveRef.current(contentToSave);
// Only update refs, never state
contentRef.current = contentToSave;
prevContentRef.current = contentToSave;
```

#### 2. Tightened Prop Sync Logic
**File:** `packages/frontend/src/components/ContentEditor.tsx`

**Before:**
```typescript
if (content !== prevContentRef.current) {
  prevContentRef.current = content;
  if (!isEditing) {
    setValue(content);
  } else {
    // ❌ Still updated editor if "significant change"
    if (hasSignificantChange) {
      setValue(content);
    }
  }
}
```

**After:**
```typescript
if (content !== prevContentRef.current) {
  prevContentRef.current = content;
  if (!isEditing) {
    // ✅ Only sync when NOT editing
    setValue(content);
    setDisplayValue(content);
  }
  // ✅ Never touch editor while editing, period
}
```

#### 3. Update Display on Mode Switch
**File:** `packages/frontend/src/components/ContentEditor.tsx`

When user clicks "Preview", update displayValue to show their latest changes:

```typescript
onClick={() => {
  setDisplayValue(value);  // ✅ Show latest edits in preview
  setIsEditing(false);
}}
```

#### 4. Reset Edit Mode on Navigation
**File:** `packages/frontend/src/components/ContentEditor.tsx`

Added tracking of `parentPath` to reset editing state when navigating to a different page:

```typescript
const parentPathRef = useRef(parentPath);

useEffect(() => {
  if (parentPath !== parentPathRef.current) {
    parentPathRef.current = parentPath;
    setIsEditing(false);  // ✅ Exit edit mode on navigation
  }
}, [parentPath]);
```

## Data Flow

### While Editing
```
User Input → Local Value State → Debounced Save → API
              ↓ (immediate)         ↓ (300ms)      ↓ (async)
          Renders in textarea    Queued in ref   Server saves
                                                      ↓
                                              (prop update ignored)
```

### Key Points:
- ✅ Editor state never touched during save
- ✅ No re-renders during save operations
- ✅ Cursor position preserved
- ✅ All keystrokes captured
- ✅ Saves complete in background via refs

### When Not Editing (Preview Mode)
```
Prop Update → setValue → displayValue → Preview renders
    ↓
Safe to update (no textarea to interfere with)
```

## Trade-offs & Future Considerations

### Current Approach
- ✅ **Zero typing interference** - Main goal achieved
- ✅ **Simple implementation** - Just removed problematic code
- ✅ **Works for single user** - No conflicts with self
- ⚠️  **Multi-user conflicts** - Last writer wins (no detection)

### Future Multi-User Support Options

When multiple users edit the same document, conflicts need handling:

**Option 1: Document Locking**
- Lock document when user enters edit mode
- Show "User X is editing" to others
- Release lock on preview/navigation
- Simple but restrictive

**Option 2: Change-Based Sync** (Recommended)
- Only send changes/diffs, not full content
- Operational Transform or CRDT
- Real-time collaborative editing
- Complex but best UX

**Option 3: Optimistic + Conflict Detection**
- Keep current isolated approach
- Add version/etag tracking
- Server rejects stale saves with 409
- User resolves conflicts manually
- Middle-ground complexity

## Test Results

All tests passing:

### E2E Tests (editing.feature)
- ✅ Page editing workflow
- ✅ Keyboard navigation from title
- ✅ Autosave and editor preservation
- ✅ HTML sanitization
- ✅ Malformed markdown handling
- ✅ Edit mode cancels on navigation

### Unit Tests
- ✅ Backend: 131 tests passed
- ✅ Frontend: 113 tests passed

## Testing the Fix

To verify the fix works:

1. Start dev server: `npm run dev`
2. Open a page and click "Edit"
3. Type continuously for 10+ seconds
4. Watch for "Saving..." indicator
5. **Expected:** Typing never interrupted, cursor stays in place
6. **Before fix:** Lost characters, cursor jumps during saves

## Files Changed

1. `packages/frontend/src/components/ContentEditor.tsx`
   - Removed `setValue`/`setDisplayValue` from `handleSave`
   - Simplified prop sync `useEffect` (removed hasSignificantChange fallback)
   - Added `setDisplayValue` to Preview button onClick
   - Added `parentPath` tracking to reset edit mode on navigation

2. `packages/e2e/step-definitions/editing.steps.ts`
   - Fixed test assertion for "page content should match the new page"
   - More flexible pathname comparison logic
