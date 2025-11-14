import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";
import type { Page } from "../../types";

interface BoardViewProps {
  groupBy: string;
  filter?: Record<string, unknown>;
  sort?: string;
  settings?: Record<string, unknown>;
  parentPath?: string;
}

export function BoardView({ groupBy, filter, sort, parentPath }: BoardViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { childPages, isLoading } = useChildPages(parentPath, refreshTrigger);
  
  const filtered = filterPages(childPages, filter);
  const sorted = sortPages(filtered, sort);
  
  const grouped = sorted.reduce((acc, page) => {
    const groupValue = String(page.frontMatter[groupBy] ?? "Uncategorized");
    if (!acc[groupValue]) {
      acc[groupValue] = [];
    }
    acc[groupValue].push(page);
    return acc;
  }, {} as Record<string, Page[]>);
  
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  
  if (isLoading) {
    return <div className="text-slate-600 p-4">Loading...</div>;
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Board View</h3>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Refresh"
          title="Refresh"
        >
          ↻
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.entries(grouped).map(([groupValue, pages]) => (
          <div
            key={groupValue}
            className="flex-shrink-0 w-64 bg-slate-50 rounded-lg p-4"
          >
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              {groupValue} ({pages.length})
            </h4>
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.path}
                  onClick={() => navigate(`/${page.path}`)}
                  className="p-3 bg-white hover:bg-slate-100 rounded cursor-pointer transition-colors border border-slate-200"
                  data-testid={`board-card-${page.path}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open page ${page.title}`}
                >
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {page.title}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {page.content.substring(0, 100)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

