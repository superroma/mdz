import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";
import type { Page } from "../../types";
import { ARIA_LABELS } from "../../constants/aria-labels";

interface ListViewProps {
  fields: string[];
  filter?: Record<string, unknown>;
  sort?: string;
  parentPath?: string;
}

export function ListView({ fields, filter, sort, parentPath }: ListViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { childPages, isLoading } = useChildPages(parentPath, refreshTrigger);
  
  const filtered = filterPages(childPages, filter);
  const sorted = sortPages(filtered, sort);
  
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  
  if (isLoading) {
    return <div className="text-slate-600 p-4">Loading...</div>;
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">List View</h3>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-slate-600 hover:text-slate-900 transition-colors"
          aria-label={ARIA_LABELS.refresh}
          title="Refresh"
        >
          ↻
        </button>
      </div>
      
      <div className="space-y-2">
        {sorted.map((page) => (
          <div
            key={page.path}
            onClick={() => navigate(`/${page.path}`)}
            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-4 flex-wrap">
              <button
                type="button"
                className="text-base font-medium text-sky-600 hover:text-sky-700 text-left"
              >
                {page.title}
              </button>
              {fields.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 uppercase">{field}:</span>
                  <span className="text-sm text-slate-700">
                    {String(page.frontMatter[field] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {sorted.length === 0 && (
        <div className="text-center py-8 text-slate-600">No pages found</div>
      )}
    </div>
  );
}

