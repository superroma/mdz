import React from "react";
import { api } from "./api";

export function Editor({
  path,
  onSaved,
}: {
  path: string;
  onSaved?: () => void;
}) {
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  React.useEffect(() => {
    api
      .page(path)
      .then((p) => setContent(p.content))
      .catch(() => setContent(""));
  }, [path]);
  async function save() {
    try {
      setStatus("saving");
      await api.save(path, content);
      setStatus("saved");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  }
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content]);
  return (
    <div style={{ padding: 8 }}>
      <textarea
        aria-label="editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", height: "80vh" }}
      />
      <div>
        <button aria-label="save" onClick={() => void save()}>
          Save
        </button>
        <span aria-live="polite" style={{ paddingLeft: 8 }}>
          {status}
        </span>
      </div>
    </div>
  );
}
