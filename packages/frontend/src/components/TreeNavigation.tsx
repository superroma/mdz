import { useNavigate, useParams } from "react-router-dom";
import type { Page } from "../types";

interface TreeItemProps {
  page: Page;
  level: number;
  onCreateChild: (parent: string) => void;
  currentPath?: string;
}

function TreeItem({ page, level, onCreateChild, currentPath }: TreeItemProps) {
  const navigate = useNavigate();
  const isSelected = currentPath === page.path;

  const handleClick = () => {
    navigate(`/${page.path}`);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChild(page.path);
  };

  return (
    <div>
      <div
        className={`
          group flex items-center gap-2 py-1.5 px-3 cursor-pointer transition-colors
          ${isSelected ? "bg-slate-700 border-l-2 border-sky-400" : "hover:bg-slate-700/50"}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        <button
          type="button"
          className="flex-1 text-left text-sm truncate"
          aria-label={`Navigate to ${page.title}`}
        >
          {page.title}
        </button>
        <button
          type="button"
          onClick={handleAddChild}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 text-xs px-1"
          aria-label={`Add child page to ${page.title}`}
          title="Add child page"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface TreeNavigationProps {
  pages: Page[];
  onCreateChild: (parent: string) => void;
}

export function TreeNavigation({ pages, onCreateChild }: TreeNavigationProps) {
  const { "*": currentPath } = useParams();

  const buildTree = (pages: Page[]) => {
    const rootPages = pages.filter((p) => !p.parent);
    const pageMap = new Map(pages.map((p) => [p.path, p]));

    const renderPage = (page: Page, level: number = 0): JSX.Element => {
      const children = pages.filter((p) => p.parent === page.path);
      return (
        <div key={page.path}>
          <TreeItem
            page={page}
            level={level}
            onCreateChild={onCreateChild}
            currentPath={currentPath}
          />
          {children.map((child) => renderPage(child, level + 1))}
        </div>
      );
    };

    return rootPages.map((page) => renderPage(page));
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      {pages.length === 0 ? (
        <div className="px-3 py-4 text-sm text-slate-400">No pages yet</div>
      ) : (
        buildTree(pages)
      )}
    </div>
  );
}

