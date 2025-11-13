import { useEffect, useRef, useCallback } from "react";
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
  frontmatterPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import { parseFrontMatter } from "../utils/front-matter";

interface ContentEditorProps {
  content: string;
  onSave: (newContent: string) => Promise<void>;
  parentPath?: string;
}

export function ContentEditor({
  content,
  onSave,
}: ContentEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<string | null>(null);
  const contentRef = useRef(content);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

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

  const handleChange = useCallback((markdown: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Store pending value
    pendingValueRef.current = markdown;

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      if (markdown !== contentRef.current) {
        onSaveRef.current(markdown).catch((error) => {
          console.error("Failed to save content:", error);
        });
      }
    }, 500);
  }, []);

  // Get markdown content without front matter for the editor
  const { content: markdownContent } = parseFrontMatter(content);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        className="flex-1 w-full bg-slate-800 rounded border border-slate-700 overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        <MDXEditor
          ref={editorRef}
          markdown={markdownContent}
          onChange={handleChange}
          contentEditableClassName="prose prose-invert max-w-none p-4"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: "JavaScript",
                ts: "TypeScript",
                tsx: "TypeScript (React)",
                jsx: "JavaScript (React)",
                css: "CSS",
                html: "HTML",
                json: "JSON",
                md: "Markdown",
                bash: "Bash",
                python: "Python",
                rust: "Rust",
                go: "Go",
              },
            }),
            diffSourcePlugin({ viewMode: "rich-text" }),
            frontmatterPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                  <InsertThematicBreak />
                  <ListsToggle />
                </>
              ),
            }),
          ]}
        />
      </div>
      <div className="text-xs text-slate-400">
        Auto-saving enabled. Changes are saved automatically.
      </div>
    </div>
  );
}
