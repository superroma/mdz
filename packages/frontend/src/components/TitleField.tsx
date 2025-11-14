import { useState, useEffect, useRef } from "react";

interface TitleFieldProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  autoFocus?: boolean;
}

export function TitleField({ title, onSave, autoFocus = false }: TitleFieldProps) {
  const [value, setValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleSave = async () => {
    if (value === title || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(value);
    } catch (error) {
      console.error("Failed to save title:", error);
      setValue(title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder="Untitled"
      className="w-full bg-transparent text-3xl font-bold text-slate-900 border-none outline-none focus:ring-0 px-0"
      aria-label="Page title"
      data-testid="page-title-input"
      disabled={isSaving}
    />
  );
}

