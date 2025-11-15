import { useState, useEffect, useRef, useCallback } from "react";
import { MDXContent } from "./MDXContent";
import { parseFrontMatter, serializeFrontMatter } from "../utils/front-matter";
import { toggleCheckboxAtLine } from "../utils/checkbox-updater";
import { ARIA_LABELS } from "../constants/aria-labels";

interface ContentEditorProps {
  content: string;
  onSave: (newContent: string) => Promise<void>;
  parentPath?: string;
}

interface HistoryEntry {
  value: string;
  timestamp: number;
}

export function ContentEditor({
  content,
  onSave,
  parentPath,
}: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [displayValue, setDisplayValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<string | null>(null);
  const displayUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef(false);

  // Deep undo system
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  const lastHistoryUpdateRef = useRef<number>(0);

  // Use refs to avoid stale closures in timeout callbacks
  const contentRef = useRef(content);
  const onSaveRef = useRef(onSave);
  const isSavingRef = useRef(isSaving);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    saveInProgressRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    // Only update from external changes if value is substantially different
    // and we're not currently editing
    if (content !== value && content !== pendingValueRef.current) {
      setValue(content);
      setDisplayValue(content);
      // Initialize undo stack with the content
      if (undoStackRef.current.length === 0) {
        undoStackRef.current = [{ value: content, timestamp: Date.now() }];
      }
    }
  }, [content, value]);

  // Cleanup: save any pending changes before unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (
        pendingValueRef.current &&
        pendingValueRef.current !== contentRef.current
      ) {
        // Save immediately on unmount
        onSaveRef.current(pendingValueRef.current).catch((error) => {
          console.error("Failed to save pending changes on unmount:", error);
        });
      }
    };
  }, []);

  const addToHistory = useCallback((newValue: string) => {
    const now = Date.now();
    // Only add to history if enough time has passed or content is significantly different
    if (now - lastHistoryUpdateRef.current > 1000) {
      undoStackRef.current.push({ value: newValue, timestamp: now });
      // Limit history size
      if (undoStackRef.current.length > 100) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = []; // Clear redo stack on new change
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

  const handleSave = useCallback(async (contentToSave: string) => {
    const currentContent = contentRef.current;

    if (contentToSave === currentContent || saveInProgressRef.current) {
      return;
    }

    // Clear any pending timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingValueRef.current = null;

    saveInProgressRef.current = true;
    setIsSaving(true);
    try {
      await onSaveRef.current(contentToSave);
      contentRef.current = contentToSave;
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, []);

  const debouncedSave = useCallback(
    (newValue: string) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Store pending value
      pendingValueRef.current = newValue;

      // Set new timeout for autosave (1 second delay)
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newValue);
      }, 1000);
    },
    [handleSave]
  );

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length > 1) {
      const currentEntry = undoStackRef.current.pop()!;
      redoStackRef.current.push(currentEntry);
      const previousEntry = undoStackRef.current[undoStackRef.current.length - 1];
      setValue(previousEntry.value);
      setDisplayValue(previousEntry.value);
      // Trigger autosave
      debouncedSave(previousEntry.value);
    }
  }, [debouncedSave]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const redoEntry = redoStackRef.current.pop()!;
      undoStackRef.current.push(redoEntry);
      setValue(redoEntry.value);
      setDisplayValue(redoEntry.value);
      // Trigger autosave
      debouncedSave(redoEntry.value);
    }
  }, [debouncedSave]);

  const handleCheckboxToggle = useCallback(
    (checkboxIndex: number) => {
      if (isEditing) {
        // In edit mode, don't handle checkbox clicks - user edits text directly
        return;
      }

      // Calculate the updated content
      let updatedContent: string;
      const baseContent = pendingValueRef.current || value;
      const { content: markdownContent, frontMatter } =
        parseFrontMatter(baseContent);
      const updatedMarkdown = toggleCheckboxAtLine(
        markdownContent,
        checkboxIndex
      );
      updatedContent = serializeFrontMatter(
        frontMatter,
        updatedMarkdown
      );

      // Update pending ref immediately so next rapid click sees this change
      pendingValueRef.current = updatedContent;

      // Update state values
      setValue(updatedContent);
      setDisplayValue(updatedContent);

      // Schedule save outside of render cycle to avoid setState during render warning
      queueMicrotask(() => {
        // For checkbox toggles (only editable content in preview mode),
        // save immediately if no save is in progress. If another save is already
        // happening (rare case of rapid successive checkbox clicks), use short debounce
        if (!saveInProgressRef.current) {
          // No save in progress, save immediately
          handleSave(updatedContent);
        } else {
          // Save in progress, use short debounce for rapid clicks
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            handleSave(updatedContent);
          }, 50);
        }
      });
    },
    [isEditing, handleSave, value]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave(value);
    } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    setDisplayValue(newValue);
    addToHistory(newValue);
    debouncedSave(newValue);
  };

  if (!isEditing) {
    const { content: markdownContent } = parseFrontMatter(displayValue);
    return (
      <div className="flex flex-col gap-4" data-testid="content-viewer">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors"
            aria-label={ARIA_LABELS.editPageContent}
            data-testid="edit-button"
          >
            Edit
          </button>
          {isSaving && (
            <span className="text-sm text-slate-600">Saving...</span>
          )}
        </div>
        <div className="prose max-w-none" data-testid="markdown-content" role="article">
          {markdownContent ? (
            <MDXContent
              content={markdownContent}
              parentPath={parentPath}
              onCheckboxToggle={handleCheckboxToggle}
            />
          ) : (
            <p className="text-slate-600">
              No content yet. Click Edit to add some.
            </p>
          )}
        </div>
      </div>
    );
  }

  const canUndo = undoStackRef.current.length > 1;
  const canRedo = redoStackRef.current.length > 0;

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="content-editor">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors"
            aria-label={ARIA_LABELS.previewPageContent}
            data-testid="preview-button"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Undo (Cmd+Z)"
            title="Undo (Cmd+Z)"
            data-testid="undo-button"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Redo (Cmd+Shift+Z)"
            title="Redo (Cmd+Shift+Z)"
            data-testid="redo-button"
          >
            ↷
          </button>
        </div>
        {isSaving && (
          <span className="text-sm text-slate-600">Saving...</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start writing..."
        className="flex-1 w-full bg-white text-slate-900 p-4 rounded border border-slate-300 focus:border-sky-500 focus:outline-none resize-none font-mono text-sm"
        aria-label={ARIA_LABELS.pageContent}
        data-testid="content-textarea"
      />
      <div className="text-xs text-slate-600" role="status" aria-live="polite">
        Changes auto-save after 1 second • <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Cmd+Z</kbd> to undo • <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Cmd+Shift+Z</kbd> to redo
      </div>
    </div>
  );
}
