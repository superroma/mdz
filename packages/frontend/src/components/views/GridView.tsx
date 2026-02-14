import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";

interface GridViewProps {
  columns?: string[];
  filter?: Record<string, unknown>;
  sort?: string;
  parentPath?: string;
}

export function GridView({ columns, filter, sort, parentPath }: GridViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { childPages, schemaFields, isLoading } = useChildPages(parentPath, refreshTrigger);

  const resolvedColumns = columns ?? schemaFields.map((f) => f.name);
  const filtered = filterPages(childPages, filter);
  const sorted = sortPages(filtered, sort);

  if (isLoading) {
    return <div className="text-slate-600 p-4">Loading...</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          {resolvedColumns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((page) => (
          <tr key={page.path}>
            <td>
              <a
                href={`/${page.path}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${page.path}`);
                }}
              >
                {page.title}
              </a>
            </td>
            {resolvedColumns.map((col) => (
              <td key={col}>{String(page.frontMatter[col] ?? "")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

