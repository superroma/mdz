import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages, sortPages } from "./filterUtils";

interface ListViewProps {
  fields?: string[];
  filter?: Record<string, unknown>;
  sort?: string;
  parentPath?: string;
}

export function ListView({ fields = [], filter, sort, parentPath }: ListViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { childPages, isLoading } = useChildPages(parentPath, refreshTrigger);

  const filtered = filterPages(childPages, filter);
  const sorted = sortPages(filtered, sort);

  if (isLoading) {
    return <div className="text-slate-600 p-4">Loading...</div>;
  }

  return (
    <ul>
      {sorted.map((page) => (
        <li key={page.path}>
          <a
            href={`/${page.path}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${page.path}`);
            }}
          >
            {page.title}
          </a>
          {fields.length > 0 && (
            <span className="text-slate-500">
              {" — "}
              {fields
                .map((f) => String(page.frontMatter[f] ?? ""))
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

