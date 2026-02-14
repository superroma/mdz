import { useState, useEffect } from "react";
import type { Page } from "../../types";
import * as api from "../../api/client";

export interface SchemaField {
  name: string;
  type: string;
  options?: string[];
}

export function useChildPages(parentPath: string | undefined, refreshTrigger?: number) {
  const [childPages, setChildPages] = useState<Page[]>([]);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!parentPath) {
      setChildPages([]);
      setSchemaFields([]);
      return;
    }
    
    const loadChildPages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allPages = await api.listPages();
        const normalizedParent = parentPath.replace(/\/README$/, "");
        const parentPage = allPages.find((p) => {
          const normalized = p.path.replace(/\/README$/, "");
          return p.path === parentPath || normalized === normalizedParent;
        });
        const schema = parentPage?.frontMatter.__schema;
        if (schema && Array.isArray(schema)) {
          setSchemaFields(schema.filter((f: SchemaField) => f.name && f.name !== "__schema"));
        } else {
          setSchemaFields([]);
        }
        const children = allPages.filter(
          (p) => p.parent === parentPath && !p.isHidden && p.isMarkdown !== false
        );
        setChildPages(children);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pages");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChildPages();
  }, [parentPath, refreshTrigger]);
  
  return { childPages, schemaFields, isLoading, error };
}

