import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { MDXContent } from "./MDXContent";
import { parseFrontMatter, serializeFrontMatter } from "../utils/front-matter";
import { toggleCheckboxAtLine } from "../utils/checkbox-updater";

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

  // Store frontmatter separately so MDXEditor only edits markdown content
  const [frontMatter, setFrontMatter] = useState<Record<string, unknown>>({});
  const [markdownOnly, setMarkdownOnly] = useState("");

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
    setValue(content);
    setDisplayValue(content);
    // Parse frontmatter from content
    const { frontMatter: fm, content: md } = parseFrontMatter(content);
    setFrontMatter(fm);
    setMarkdownOnly(md);
  }, [content]);

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

    if (contentToSave === currentContent || isSavingRef.current) {
      return;
    }

    // Clear any pending timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingValueRef.current = null;

    setIsSaving(true);
    try {
      await onSaveRef.current(contentToSave);
      setValue(contentToSave);
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
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

      // Apply toggle immediately to value state
      setValue((currentValue) => {
        const baseContent = pendingValueRef.current || currentValue;
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
        debouncedSave(updatedContent);
        
        // Delay updating the display value to prevent re-render during rapid clicks
        if (displayUpdateTimeoutRef.current) {
          clearTimeout(displayUpdateTimeoutRef.current);
        }
        displayUpdateTimeoutRef.current = setTimeout(() => {
          setDisplayValue(updatedContent);
        }, 100);
        
        return updatedContent;
      });
    },
    [isEditing, debouncedSave]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave(value);
    }
  };

  if (!isEditing) {
    const { content: markdownContent } = parseFrontMatter(displayValue);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="prose prose-invert max-w-none">
          {markdownContent ? (
            <MDXContent
              content={markdownContent}
              parentPath={parentPath}
              onCheckboxToggle={handleCheckboxToggle}
            />
          ) : (
            <p className="text-slate-400">
              No content yet. Click Edit to add some.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => {
            setValue(content);
            setIsEditing(false);
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => handleSave(value)}
          disabled={isSaving || value === content}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <div 
        className="flex-1 w-full bg-slate-800 text-slate-100 rounded border border-slate-700 focus-within:border-sky-500"
        role="textbox"
        aria-label="Page content"
        onKeyDown={handleKeyDown}
      >
        <MDXEditor
          markdown={value}
          onChange={setValue}
          placeholder="Start writing..."
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            imagePlugin(),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          ]}
          toMarkdownOptions={{
            bullet: '-',
            listItemIndent: 'one',
            rule: '-',
            strong: '*',
            emphasis: '_',
          }}
        />
      </div>
      <div className="text-xs text-slate-400">
        Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Cmd+S</kbd> or{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Ctrl+S</kbd> to save
      </div>
    </div>
  );
}
