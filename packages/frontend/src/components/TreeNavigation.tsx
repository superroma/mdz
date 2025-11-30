import { useNavigate, useLocation } from "react-router-dom";
import type { Page } from "../types";
import { ARIA_LABELS } from "../constants/aria-labels";

interface TreeItemProps {
  page: Page;
  level: number;
  onCreateChild: (parent: string) => void;
  onNavigate?: () => void;
  currentPath?: string;
}

function TreeItem({
  page,
  level,
  onCreateChild,
  onNavigate,
  currentPath,
}: TreeItemProps) {
  const navigate = useNavigate();
  const isSelected = currentPath === page.path;
  const isMarkdown = page.isMarkdown !== false;

  const handleClick = () => {
    if (isMarkdown) {
      navigate(`/${page.path}`);
      onNavigate?.();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChild(page.path);
  };

  const baseClasses =
    "group flex items-center gap-2 py-1.5 px-3 transition-colors";
  const selectedClasses = isSelected
    ? "bg-slate-200 border-l-2 border-sky-500"
    : isMarkdown 
      ? "active:bg-slate-100 md:hover:bg-slate-100" 
      : "";

  return (
    <div>
      <div
        className={`${baseClasses} ${selectedClasses}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        role="group"
        aria-label={ARIA_LABELS.pageItem(page.title)}
      >
        <div
          role="button"
          tabIndex={0}
          className={`flex-1 text-left text-sm truncate ${
            isMarkdown ? "cursor-pointer" : "cursor-default text-slate-500 italic"
          }`}
          onClick={handleClick}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
          aria-label={ARIA_LABELS.navigateTo(page.title)}
          aria-current={isSelected ? "page" : undefined}
        >
          {page.title}
        </div>
        {isMarkdown && (
          <button
            type="button"
            onClick={handleAddChild}
            className={`${
              isSelected
                ? "opacity-100"
                : "opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            } text-slate-600 active:text-slate-900 md:hover:text-slate-900 text-xs px-1`}
            aria-label={ARIA_LABELS.addChildPage(page.title)}
            title="Add child page"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

interface TreeNavigationProps {
  pages: Page[];
  onCreateChild: (parent: string) => void;
  onNavigate?: () => void;
}

export function TreeNavigation({
  pages,
  onCreateChild,
  onNavigate,
}: TreeNavigationProps) {
  const location = useLocation();
  // Remove leading slash and decode URL encoding to match page paths
  const currentPath = decodeURIComponent(location.pathname.substring(1));

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
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
          {children.map((child) => renderPage(child, level + 1))}
        </div>
      );
    };

    return rootPages.map((page) => renderPage(page));
  };

  return (
    <nav
      className="flex flex-col overflow-y-auto"
      aria-label={ARIA_LABELS.pageTree}
    >
      {pages.length === 0 ? (
        <div className="px-3 py-4 text-sm text-slate-600" role="status">No pages yet</div>
      ) : (
        buildTree(pages)
      )}
    </nav>
  );
}
