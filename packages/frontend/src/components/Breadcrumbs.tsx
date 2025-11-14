import { useNavigate, useParams } from "react-router-dom";
import type { Page } from "../types";
import { ARIA_LABELS } from "../constants/aria-labels";

interface BreadcrumbsProps {
  pages: Page[];
  currentPath: string;
}

export function Breadcrumbs({ pages, currentPath }: BreadcrumbsProps) {
  const navigate = useNavigate();
  const pageMap = new Map(pages.map((p) => [p.path, p]));

  const buildBreadcrumbPath = (path: string): Page[] => {
    const breadcrumbs: Page[] = [];
    const currentPage = pageMap.get(path);

    if (!currentPage) return breadcrumbs;

    breadcrumbs.unshift(currentPage);
    let parent = currentPage.parent;

    while (parent) {
      const parentPage = pageMap.get(parent);
      if (!parentPage) break;
      breadcrumbs.unshift(parentPage);
      parent = parentPage.parent;
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbPath(currentPath);

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400" aria-label={ARIA_LABELS.breadcrumbNavigation} data-testid="breadcrumb">
      {breadcrumbs.map((page, index) => (
        <div key={page.path} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          <button
            type="button"
            onClick={() => navigate(`/${page.path}`)}
            className="hover:text-slate-200 transition-colors"
            aria-label={ARIA_LABELS.navigateTo(page.title)}
            aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
            data-testid={`breadcrumb-${page.path}`}
          >
            {page.title}
          </button>
        </div>
      ))}
    </nav>
  );
}

