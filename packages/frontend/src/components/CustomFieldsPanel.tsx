import { useState, useEffect } from "react";
import type { Page } from "../types";
import yaml from "js-yaml";
import { ARIA_LABELS } from "../constants/aria-labels";

interface FieldSchema {
  name: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  options?: string[];
}

interface CustomFieldsPanelProps {
  page: Page;
  pages: Page[];
  onFieldChange: (fieldName: string, value: unknown) => Promise<void>;
}

function getParentSchema(page: Page, pages: Page[]): FieldSchema[] {
  if (!page.parent) return [];
  
  const normalizedParentPath = page.parent.replace(/\/README$/, "");
  
  const parent = pages.find((p) => {
    const normalizedPath = p.path.replace(/\/README$/, "");
    return p.path === page.parent || normalizedPath === normalizedParentPath;
  });
  
  if (!parent) return [];
  
  const schema = parent.frontMatter.__schema;
  if (!schema || !Array.isArray(schema)) return [];
  
  return schema as FieldSchema[];
}

function getFieldValue(page: Page, fieldName: string): unknown {
  return page.frontMatter[fieldName] ?? "";
}

function hasFrontMatter(page: Page): boolean {
  return Object.keys(page.frontMatter).length > 0;
}

function isComplexField(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    (Array.isArray(value) || typeof value === "object")
  );
}

function formatComplexField(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.length} item${value.length !== 1 ? "s" : ""}]`;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    return `{${keys.length} key${keys.length !== 1 ? "s" : ""}}`;
  }
  return String(value);
}

function formatComplexFieldTooltip(value: unknown): string {
  try {
    return yaml.dump(value, { lineWidth: -1, indent: 2 }).trim();
  } catch {
    return String(value);
  }
}

const STORAGE_KEY = "customFieldsPanelExpanded";

function getInitialExpandedState(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "true";
}

function setExpandedState(expanded: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(expanded));
}

export function CustomFieldsPanel({ page, pages, onFieldChange }: CustomFieldsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);
  const schema = getParentSchema(page, pages);
  
  // Show panel if page has frontmatter or if there's a schema
  if (!hasFrontMatter(page) && schema.length === 0) {
    return null;
  }

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setExpandedState(newExpanded);
  };
  
  return (
    <div className="mb-4 border border-slate-300 rounded-lg">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-t-lg"
        aria-label={isExpanded ? ARIA_LABELS.collapseCustomFields : ARIA_LABELS.expandCustomFields}
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium text-slate-700">Fields</span>
        <span className="text-slate-600" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-3 border-t border-slate-300">
          {schema.length > 0 ? (
            schema.map((field) => (
              <FieldEditor
                key={field.name}
                field={field}
                value={getFieldValue(page, field.name)}
                onChange={(value) => onFieldChange(field.name, value)}
              />
            ))
          ) : (
            // Show all frontmatter fields when no schema
            Object.keys(page.frontMatter).map((key) => {
              const value = getFieldValue(page, key);
              if (isComplexField(value)) {
                return (
                  <ComplexFieldDisplay
                    key={key}
                    fieldName={key}
                    value={value}
                  />
                );
              }
              return (
                <TextFieldEditor
                  key={key}
                  fieldName={key}
                  value={value}
                  onChange={(value) => onFieldChange(key, value)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface FieldEditorProps {
  field: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => Promise<void>;
}

function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = async (newValue: unknown) => {
    setLocalValue(newValue);
    setIsSaving(true);
    try {
      await onChange(newValue);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 uppercase tracking-wide">
        {field.name}
      </label>
      
      {field.type === "text" && (
        <input
          type="text"
          value={String(localValue ?? "")}
          onChange={(e) => handleChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isSaving}
          aria-label={ARIA_LABELS.customField(field.name)}
        />
      )}
      
      {field.type === "number" && (
        <input
          type="number"
          value={Number(localValue ?? 0)}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isSaving}
          aria-label={ARIA_LABELS.customField(field.name)}
        />
      )}
      
      {field.type === "date" && (
        <input
          type="date"
          value={localValue ? String(localValue).split('T')[0] : ""}
          onChange={(e) => handleChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isSaving}
          aria-label={ARIA_LABELS.customField(field.name)}
        />
      )}
      
      {field.type === "select" && (
        <select
          value={String(localValue ?? "")}
          onChange={(e) => handleChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isSaving}
          aria-label={ARIA_LABELS.customField(field.name)}
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      
      {field.type === "checkbox" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(localValue)}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 text-sky-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-sky-500"
            disabled={isSaving}
            aria-label={ARIA_LABELS.customField(field.name)}
          />
          <span className="text-sm text-slate-700">
            {Boolean(localValue) ? "Yes" : "No"}
          </span>
        </label>
      )}
    </div>
  );
}

interface TextFieldEditorProps {
  fieldName: string;
  value: unknown;
  onChange: (value: unknown) => Promise<void>;
}

function TextFieldEditor({ fieldName, value, onChange }: TextFieldEditorProps) {
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setLocalValue(String(value ?? ""));
  }, [value]);
  
  const handleChange = async (newValue: string) => {
    setLocalValue(newValue);
    setIsSaving(true);
    try {
      await onChange(newValue);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 uppercase tracking-wide">
        {fieldName}
      </label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        disabled={isSaving}
      />
    </div>
  );
}

interface ComplexFieldDisplayProps {
  fieldName: string;
  value: unknown;
}

function ComplexFieldDisplay({ fieldName, value }: ComplexFieldDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const formattedValue = formatComplexField(value);
  const tooltipContent = formatComplexFieldTooltip(value);

  return (
    <div className="flex flex-row items-center gap-2 relative">
      <label className="text-xs text-slate-600 tracking-wide whitespace-nowrap">
        {fieldName}
      </label>
      <div
        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-700 cursor-help font-mono"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        tabIndex={0}
        role="button"
        aria-label={ARIA_LABELS.customFieldValue(fieldName, formattedValue)}
      >
        {formattedValue}
      </div>
      {showTooltip && (
        <div
          className="absolute z-10 top-full mt-1 left-0 px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono whitespace-pre-wrap max-w-md shadow-lg"
          style={{ wordBreak: "break-word" }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

