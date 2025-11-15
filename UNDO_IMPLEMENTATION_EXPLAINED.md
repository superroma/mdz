# How Undo/Redo is Implemented

## Overview

The undo/redo system is implemented as a **deep undo** mechanism that persists across mode switches (edit ↔ preview). It uses two stacks to track history and uses React refs to maintain state across renders without causing re-renders.

## Data Structures

### 1. History Entry Interface

```typescript
interface HistoryEntry {
  value: string;      // The content snapshot
  timestamp: number;  // When this entry was created
}
```

### 2. Core State Variables

```typescript
// Two stacks for undo/redo
const undoStackRef = useRef<HistoryEntry[]>([]);
const redoStackRef = useRef<HistoryEntry[]>([]);
const lastHistoryUpdateRef = useRef<number>(0);

// Current editor state
const [value, setValue] = useState(content);
const [displayValue, setDisplayValue] = useState(content);
```

**Why refs?** Using refs prevents unnecessary re-renders while preserving state across component lifecycle events, including mode switches.

## Core Functions

### 1. `addToHistory()` - Adding Entries to History

```typescript
const addToHistory = useCallback((newValue: string) => {
  const now = Date.now();
  
  // Only add to history if enough time has passed (1 second)
  if (now - lastHistoryUpdateRef.current > 1000) {
    undoStackRef.current.push({ value: newValue, timestamp: now });
    
    // Limit history size to 100 entries
    if (undoStackRef.current.length > 100) {
      undoStackRef.current.shift();
    }
    
    // Clear redo stack on new change
    redoStackRef.current = [];
    lastHistoryUpdateRef.current = now;
  } else {
    // Update the last entry instead of adding new one for rapid changes
    if (undoStackRef.current.length > 0) {
      undoStackRef.current[undoStackRef.current.length - 1] = { 
        value: newValue, 
        timestamp: now 
      };
    }
  }
}, []);
```

**Key behaviors:**

- **Time-based grouping**: Changes within 1 second are grouped together (updates the last entry)
- **Memory limit**: Maximum 100 history entries (older entries removed)
- **Clears redo stack**: Any new change invalidates the redo history
- **Timestamps**: Used to determine if enough time has passed

### 2. `handleUndo()` - Undo Operation

```typescript
const handleUndo = useCallback(() => {
  if (undoStackRef.current.length > 1) {
    // Pop current state and move to redo stack
    const currentEntry = undoStackRef.current.pop()!;
    redoStackRef.current.push(currentEntry);
    
    // Get previous state
    const previousEntry = undoStackRef.current[undoStackRef.current.length - 1];
    
    // Update UI
    setValue(previousEntry.value);
    setDisplayValue(previousEntry.value);
    
    // Trigger autosave with previous value
    debouncedSave(previousEntry.value);
  }
}, [debouncedSave]);
```

**How it works:**

1. Checks if there's something to undo (needs at least 2 entries)
2. Pops current state from undo stack
3. Pushes current state to redo stack (so you can redo it later)
4. Gets the previous state (now at top of undo stack)
5. Updates both `value` and `displayValue` with previous content
6. Triggers autosave to persist the change

### 3. `handleRedo()` - Redo Operation

```typescript
const handleRedo = useCallback(() => {
  if (redoStackRef.current.length > 0) {
    // Pop from redo stack
    const redoEntry = redoStackRef.current.pop()!;
    
    // Push back to undo stack
    undoStackRef.current.push(redoEntry);
    
    // Update UI
    setValue(redoEntry.value);
    setDisplayValue(redoEntry.value);
    
    // Trigger autosave
    debouncedSave(redoEntry.value);
  }
}, [debouncedSave]);
```

**How it works:**

1. Checks if there's something to redo (redo stack not empty)
2. Pops state from redo stack
3. Pushes it back to undo stack
4. Updates UI with redo content
5. Triggers autosave to persist

## Integration Points

### When History is Recorded

History entries are added whenever the user types:

```typescript
const handleValueChange = (newValue: string) => {
  setValue(newValue);
  setDisplayValue(newValue);
  addToHistory(newValue);     // ← Record in history
  debouncedSave(newValue);     // ← Trigger autosave
};
```

### Keyboard Shortcuts

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    handleSave(value);
  } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    handleUndo();  // ← Cmd/Ctrl + Z
  } else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
    e.preventDefault();
    handleRedo();  // ← Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
  }
};
```

### UI Buttons

```typescript
const canUndo = undoStackRef.current.length > 1;
const canRedo = redoStackRef.current.length > 0;

<button
  onClick={handleUndo}
  disabled={!canUndo}
  aria-label="Undo (Cmd+Z)"
>
  ↶
</button>

<button
  onClick={handleRedo}
  disabled={!canRedo}
  aria-label="Redo (Cmd+Shift+Z)"
>
  ↷
</button>
```

## Why "Deep Undo"?

The term "deep undo" refers to the fact that undo history persists across mode switches:

### Traditional (Shallow) Undo
```
Edit mode → make changes → switch to Preview → loses history ❌
```

### Deep Undo (Our Implementation)
```
Edit mode → make changes → switch to Preview → switch back to Edit → history intact ✅
```

**How it's achieved:**

1. **Refs persist across renders**: `undoStackRef` and `redoStackRef` maintain their values even when switching modes
2. **No reset on mode change**: The Preview button no longer calls `setValue(content)` which would reset state
3. **Both stacks preserved**: Both undo and redo stacks remain untouched during mode switches

## Visual Example

Let's trace through an example:

### Initial State
```
undoStack: ["Original content"]
redoStack: []
current: "Original content"
```

### User types "Hello"
```
undoStack: ["Original content", "Hello"]
redoStack: []
current: "Hello"
```

### User types " World" (after 1+ second)
```
undoStack: ["Original content", "Hello", "Hello World"]
redoStack: []
current: "Hello World"
```

### User presses Cmd+Z (Undo)
```
undoStack: ["Original content", "Hello"]
redoStack: ["Hello World"]
current: "Hello"
```

### User presses Cmd+Shift+Z (Redo)
```
undoStack: ["Original content", "Hello", "Hello World"]
redoStack: []
current: "Hello World"
```

### User switches to Preview and back to Edit
```
undoStack: ["Original content", "Hello", "Hello World"]  ← PRESERVED!
redoStack: []
current: "Hello World"
```

### User makes new change "Hello World!"
```
undoStack: ["Original content", "Hello", "Hello World", "Hello World!"]
redoStack: []  ← Cleared because new change invalidates redo
current: "Hello World!"
```

## Configuration Options

### Adjustable Parameters

1. **History grouping time** (line 92):
   ```typescript
   if (now - lastHistoryUpdateRef.current > 1000) {  // ← 1000ms = 1 second
   ```

2. **Maximum history size** (line 95):
   ```typescript
   if (undoStackRef.current.length > 100) {  // ← 100 entries max
   ```

3. **Autosave delay** (line 151):
   ```typescript
   saveTimeoutRef.current = setTimeout(() => {
     handleSave(newValue);
   }, 1000);  // ← 1000ms = 1 second
   ```

## Benefits of This Implementation

1. **Memory efficient**: Groups rapid changes, limits history size
2. **Persistent**: Survives mode switches and component re-renders
3. **Intuitive**: Standard Cmd+Z / Cmd+Shift+Z shortcuts
4. **Integrated with autosave**: Undo/redo operations trigger autosave
5. **No re-render overhead**: Uses refs instead of state for history
6. **Timestamped**: Can be extended for features like "restore from X minutes ago"

## Potential Enhancements

Future improvements could include:

1. **Cursor position preservation**: Save and restore cursor position with each undo/redo
2. **Visual diff**: Show what changed between undo states
3. **Named snapshots**: Allow users to create labeled save points
4. **Persistent history**: Save history to localStorage for recovery after page refresh
5. **Time travel UI**: Visual timeline showing all history entries
6. **Collaborative undo**: Handle conflicts in multi-user scenarios
