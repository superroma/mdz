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

  // Use refs to avoid stale closures in timeout callbacks
  const contentRef = useRef(content);
  const onSaveRef = useRef(onSave);
  const isSavingRef = useRef(isSaving);
  const prevContentRef = useRef(content);

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
    // Only sync from prop when content actually changes AND we're not actively editing
    // This prevents race conditions where autosave responses overwrite local edits
    // while preserving editor state when switching between edit/preview modes
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      if (!isEditing) {
        setValue(content);
        setDisplayValue(content);
      } else {
        const hasSignificantChange = Math.abs(content.length - value.length) > 100;
        if (hasSignificantChange) {
          setIsEditing(false);
          setValue(content);
          setDisplayValue(content);
        }
      }
    }
  }, [content, isEditing, value]);

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

  const handleSave = useCallback(async (contentToSave: string) => {
    const currentContent = contentRef.current;

    if (contentToSave === currentContent) {
      return;
    }

    // If save is already in progress, store as pending
    if (saveInProgressRef.current) {
      pendingValueRef.current = contentToSave;
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
      setValue(contentToSave);
      setDisplayValue(contentToSave); // Update display value so preview shows latest content
      // Update contentRef immediately after successful save
      contentRef.current = contentToSave;
      prevContentRef.current = contentToSave; // Update prev ref to avoid re-syncing on prop update
      
      // After save completes, check if there's a pending save
      if (pendingValueRef.current && pendingValueRef.current !== contentToSave) {
        const nextContent = pendingValueRef.current;
        pendingValueRef.current = null;
        saveInProgressRef.current = false;
        setIsSaving(false);
        // Recursively save the pending content
        await handleSave(nextContent);
        return;
      }
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

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newValue);
      }, 300);
    },
    [handleSave]
  );

  const handleCheckboxToggle = useCallback(
    (checkboxIndex: number) => {
      if (isEditing) {
        // In edit mode, don't handle checkbox clicks - user edits text directly
        return;
      }

      // Calculate the updated content first
      // Use contentRef for the most up-to-date saved content, or pending if available
      const baseContent = pendingValueRef.current || contentRef.current;
      const { content: markdownContent, frontMatter } =
        parseFrontMatter(baseContent);
      const updatedMarkdown = toggleCheckboxAtLine(
        markdownContent,
        checkboxIndex
      );
      const updatedContent = serializeFrontMatter(
        frontMatter,
        updatedMarkdown
      );

      // Update pending ref immediately so next rapid click sees this change
      pendingValueRef.current = updatedContent;

      // Update both value and display value
      setValue(updatedContent);
      setDisplayValue(updatedContent);

      // Save immediately for checkbox toggles
      handleSave(updatedContent);
    },
    [isEditing, handleSave]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSave(newValue);
  };

  const { content: markdownContent } = parseFrontMatter(displayValue);

  return (
    <>
      {/* Preview Mode */}
      {!isEditing && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors"
              aria-label={ARIA_LABELS.editPageContent}
            >
              Edit
            </button>
          </div>
          <div className="prose max-w-none" role="article">
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
      )}

      {/* Edit Mode - Hidden when in preview mode to preserve editor state */}
      <div 
        className="flex flex-col gap-4 h-full" 
        style={{ display: isEditing ? 'flex' : 'none' }}
      >
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors"
            aria-label={ARIA_LABELS.previewPageContent}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => handleSave(value)}
            disabled={isSaving || value === content}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={ARIA_LABELS.savePageContent}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing..."
          className="flex-1 w-full bg-white text-slate-900 p-4 rounded border border-slate-300 focus:border-sky-500 focus:outline-none resize-none font-mono text-sm"
          aria-label={ARIA_LABELS.pageContent}
        />
        <div className="text-xs text-slate-600" role="status" aria-live="polite">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Cmd+S</kbd> or{" "}
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Ctrl+S</kbd> to save
          {isSaving && <span className="ml-2 text-sky-600">Saving...</span>}
          {!isSaving && value !== content && <span className="ml-2 text-amber-600">Unsaved changes</span>}
        </div>
      </div>
    </>
  );
}
