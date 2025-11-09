import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";
import type { Page } from "../../types";

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
    return <div className="text-slate-400 p-4">Loading...</div>;
  }
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Grid View</h3>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Refresh"
          title="Refresh"
        >
          ↻
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-2 text-sm font-medium text-slate-300">Title</th>
              {columns.map((col) => (
                <th key={col} className="text-left p-2 text-sm font-medium text-slate-300">
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
                className="border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <td className="p-2">
                  <button
                    type="button"
                    className="text-sm text-sky-400 hover:text-sky-300 text-left"
                  >
                    {page.title}
                  </button>
                </td>
                {columns.map((col) => (
                  <td key={col} className="p-2 text-sm text-slate-300">
                    {String(page.frontMatter[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sorted.length === 0 && (
        <div className="text-center py-8 text-slate-400">No pages found</div>
      )}
    </div>
  );
}

