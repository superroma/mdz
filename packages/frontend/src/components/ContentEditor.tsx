import { useState, useEffect } from "react";
import { MDXContent } from "./MDXContent";
import { parseFrontMatter } from "../utils/front-matter";

interface ContentEditorProps {
  content: string;
  onSave: (newContent: string) => Promise<void>;
  parentPath?: string;
}

export function ContentEditor({ content, onSave, parentPath }: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const handleSave = async () => {
    if (value === content || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(value);
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isEditing) {
    const { content: markdownContent } = parseFrontMatter(content);
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
            <MDXContent content={markdownContent} parentPath={parentPath} />
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
          onClick={handleSave}
          disabled={isSaving || value === content}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start writing..."
        className="flex-1 w-full bg-slate-800 text-slate-100 p-4 rounded border border-slate-700 focus:border-sky-500 focus:outline-none resize-none font-mono text-sm"
        aria-label="Page content"
      />
      <div className="text-xs text-slate-400">
        Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Cmd+S</kbd> or{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Ctrl+S</kbd> to save
      </div>
    </div>
  );
}
