import { useState, useEffect } from "react";
import type { Page } from "../../types";
import * as api from "../../api/client";

export function useChildPages(parentPath: string | undefined, refreshTrigger?: number) {
  const [childPages, setChildPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!parentPath) {
      setChildPages([]);
      return;
    }
    
    const loadChildPages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allPages = await api.listPages();
        const children = allPages.filter((p) => p.parent === parentPath);
        setChildPages(children);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pages");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChildPages();
  }, [parentPath, refreshTrigger]);
  
  return { childPages, isLoading, error };
}

