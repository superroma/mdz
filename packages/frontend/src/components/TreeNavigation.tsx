import { useNavigate, useLocation } from "react-router-dom";
import type { Page } from "../types";

function sanitizePathForTestId(path: string): string {
  return path.replace(/\//g, "-");
}

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
  const isMarkdown = page.isMarkdown !== false; // default to true for backward compatibility

  const handleClick = () => {
    // Only navigate if it's a markdown page
    if (isMarkdown) {
      navigate(`/${page.path}`);
      // Close mobile sidebar after navigation
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

  const testIdPath = sanitizePathForTestId(page.path);

  return (
    <div>
      <div
        className={`${baseClasses} ${selectedClasses}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        data-testid={`tree-item-${testIdPath}`}
        role="group"
        aria-label={`Page item: ${page.title}`}
      >
        <div
          role="button"
          tabIndex={0}
          className={`flex-1 text-left text-sm truncate ${
            isMarkdown ? "cursor-pointer" : "cursor-default text-slate-500 italic"
          }`}
          onClick={handleClick}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
          aria-label={`Navigate to ${page.title}`}
          aria-current={isSelected ? "page" : undefined}
          data-testid={`navigate-to-${testIdPath}`}
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
            aria-label={`Add child page to ${page.title}`}
            title="Add child page"
            data-testid={`add-child-to-${testIdPath}`}
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
      aria-label="Page tree"
      data-testid="page-tree"
    >
      {pages.length === 0 ? (
        <div className="px-3 py-4 text-sm text-slate-600" role="status">No pages yet</div>
      ) : (
        buildTree(pages)
      )}
    </nav>
  );
}
