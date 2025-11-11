import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
}

export function MonacoEditor({ 
  value, 
  onChange, 
  onKeyDown
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Focus the editor
    editor.focus();
    
    // Add keyboard shortcut for save (Cmd+S / Ctrl+S)
    editor.addCommand(
      // Cmd+S on Mac, Ctrl+S on Windows/Linux
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        if (onKeyDown) {
          const syntheticEvent = new KeyboardEvent("keydown", {
            key: "s",
            ctrlKey: true,
            metaKey: true,
          }) as React.KeyboardEvent<HTMLDivElement>;
          onKeyDown(syntheticEvent);
        }
      }
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value ?? "");
  };

  useEffect(() => {
    // Handle keyboard events at container level
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (onKeyDown) {
          onKeyDown(e as React.KeyboardEvent<HTMLDivElement>);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [onKeyDown]);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 border border-slate-700 rounded overflow-hidden"
      role="textbox"
      aria-label="Page content"
      aria-multiline="true"
    >
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          wrappingIndent: "same",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: {
            enabled: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "always",
          padding: {
            top: 16,
            bottom: 16,
          },
        }}
      />
    </div>
  );
}
