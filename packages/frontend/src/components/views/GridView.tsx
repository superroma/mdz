import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";
import type { Page } from "../../types";
import { ARIA_LABELS } from "../../constants/aria-labels";

interface GridViewProps {
  columns: string[];
  filter?: Record<string, unknown>;
  sort?: string;
  parentPath?: string;
}

export function GridView({ columns, filter, sort, parentPath }: GridViewProps) {
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
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Grid View</h3>
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
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left p-2 text-sm font-medium text-slate-700">Title</th>
              {columns.map((col) => (
                <th key={col} className="text-left p-2 text-sm font-medium text-slate-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((page) => (
              <tr
                key={page.path}
                onClick={() => navigate(`/${page.path}`)}
                className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="p-2">
                  <button
                    type="button"
                    className="text-sm text-sky-600 hover:text-sky-700 text-left"
                  >
                    {page.title}
                  </button>
                </td>
                {columns.map((col) => (
                  <td key={col} className="p-2 text-sm text-slate-700">
                    {String(page.frontMatter[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sorted.length === 0 && (
        <div className="text-center py-8 text-slate-600">No pages found</div>
      )}
    </div>
  );
}

