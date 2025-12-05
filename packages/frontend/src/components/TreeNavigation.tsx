import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Page } from "../types";
import { ARIA_LABELS } from "../constants/aria-labels";
import { usePageStore } from "../store/usePageStore";

interface DragState {
  draggedPath: string | null;
  dropTargetPath: string | null;
  dropPosition: "before" | "after" | null;
}

interface TreeItemProps {
  page: Page;
  level: number;
  onCreateChild: (parent: string) => void;
  onNavigate?: () => void;
  currentPath?: string;
  dragState: DragState;
  onDragStart: (path: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, path: string) => void;
  onDrop: (e: React.DragEvent, targetPath: string) => void;
  hasChildren?: boolean;
}

function TreeItem({
  page,
  level,
  onCreateChild,
  onNavigate,
  currentPath,
  dragState,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  hasChildren,
}: TreeItemProps) {
  const navigate = useNavigate();
  const isSelected = currentPath === page.path;
  const isMarkdown = page.isMarkdown !== false;
  const isDragging = dragState.draggedPath === page.path;
  const isDropTarget = dragState.dropTargetPath === page.path;
  const canDrag = isMarkdown && !page.isHidden;
  const showAfterIndicator = !hasChildren;

  const handleClick = () => {
    if (isMarkdown) {
      navigate(`/${page.path}`);
      onNavigate?.();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChild(page.path);
    onNavigate?.();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", page.path);
    onDragStart(page.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrag || page.isHidden) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(e, page.path);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, page.path);
  };

  const baseClasses =
    "group flex items-center gap-2 py-1.5 px-3 transition-colors";
  const selectedClasses = isSelected
    ? "bg-slate-200 border-l-2 border-sky-500"
    : isMarkdown 
      ? "active:bg-slate-100 md:hover:bg-slate-100" 
      : "";
  const dragClasses = isDragging ? "opacity-50" : "";
  const dropIndicatorClasses = isDropTarget
    ? dragState.dropPosition === "before"
      ? "border-t-2 border-sky-500"
      : showAfterIndicator
        ? "border-b-2 border-sky-500"
        : ""
    : "";

  return (
    <div>
      <div
        className={`${baseClasses} ${selectedClasses} ${dragClasses} ${dropIndicatorClasses}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        role="group"
        aria-label={ARIA_LABELS.pageItem(page.title)}
        draggable={canDrag}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
  const currentPath = decodeURIComponent(location.pathname.substring(1));
  const { reorderPages } = usePageStore();

  const [dragState, setDragState] = useState<DragState>({
    draggedPath: null,
    dropTargetPath: null,
    dropPosition: null,
  });

  const handleDragStart = (path: string) => {
    setDragState({
      draggedPath: path,
      dropTargetPath: null,
      dropPosition: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      draggedPath: null,
      dropTargetPath: null,
      dropPosition: null,
    });
  };

  const handleDragOver = (e: React.DragEvent, targetPath: string) => {
    if (!dragState.draggedPath || dragState.draggedPath === targetPath) return;

    const draggedPage = pages.find(p => p.path === dragState.draggedPath);
    const targetPage = pages.find(p => p.path === targetPath);
    if (!draggedPage || !targetPage) return;

    const draggedParent = draggedPage.parent ?? null;
    const targetParent = targetPage.parent ?? null;
    if (draggedParent !== targetParent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position: "before" | "after" = e.clientY < midY ? "before" : "after";

    setDragState(prev => ({
      ...prev,
      dropTargetPath: targetPath,
      dropPosition: position,
    }));
  };

  const handleDropZoneDragOver = (e: React.DragEvent, afterPath: string) => {
    if (!dragState.draggedPath || dragState.draggedPath === afterPath) return;

    const draggedPage = pages.find(p => p.path === dragState.draggedPath);
    const afterPage = pages.find(p => p.path === afterPath);
    if (!draggedPage || !afterPage) return;

    const draggedParent = draggedPage.parent ?? null;
    const afterParent = afterPage.parent ?? null;
    if (draggedParent !== afterParent) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    setDragState(prev => ({
      ...prev,
      dropTargetPath: `__after__${afterPath}`,
      dropPosition: "after",
    }));
  };

  const handleDropZoneDrop = async (e: React.DragEvent, afterPath: string) => {
    e.preventDefault();

    if (!dragState.draggedPath || dragState.draggedPath === afterPath) {
      handleDragEnd();
      return;
    }

    const draggedPage = pages.find(p => p.path === dragState.draggedPath);
    const afterPage = pages.find(p => p.path === afterPath);
    if (!draggedPage || !afterPage) {
      handleDragEnd();
      return;
    }

    const draggedParent = draggedPage.parent ?? null;
    const afterParent = afterPage.parent ?? null;
    if (draggedParent !== afterParent) {
      handleDragEnd();
      return;
    }

    const siblings = pages.filter(p => {
      const pParent = p.parent ?? null;
      return pParent === draggedParent && !p.isHidden && p.isMarkdown !== false;
    });

    const getPageName = (path: string) => {
      const parts = path.split("/");
      return parts[parts.length - 1];
    };

    const currentOrder = siblings.map(p => getPageName(p.path));
    const draggedName = getPageName(draggedPage.path);
    const afterName = getPageName(afterPage.path);

    const newOrder = currentOrder.filter(name => name !== draggedName);
    const afterIndex = newOrder.indexOf(afterName);
    newOrder.splice(afterIndex + 1, 0, draggedName);

    handleDragEnd();

    try {
      await reorderPages(draggedParent, newOrder);
    } catch {
      // Error already handled by store
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();

    if (!dragState.draggedPath || dragState.draggedPath === targetPath) {
      handleDragEnd();
      return;
    }

    const draggedPage = pages.find(p => p.path === dragState.draggedPath);
    const targetPage = pages.find(p => p.path === targetPath);
    if (!draggedPage || !targetPage) {
      handleDragEnd();
      return;
    }

    const draggedParent = draggedPage.parent ?? null;
    const targetParent = targetPage.parent ?? null;
    if (draggedParent !== targetParent) {
      handleDragEnd();
      return;
    }

    const siblings = pages.filter(p => {
      const pParent = p.parent ?? null;
      return pParent === draggedParent && !p.isHidden && p.isMarkdown !== false;
    });

    const getPageName = (path: string) => {
      const parts = path.split("/");
      return parts[parts.length - 1];
    };

    const currentOrder = siblings.map(p => getPageName(p.path));
    const draggedName = getPageName(draggedPage.path);
    const targetName = getPageName(targetPage.path);

    const newOrder = currentOrder.filter(name => name !== draggedName);
    const targetIndex = newOrder.indexOf(targetName);
    const insertIndex = dragState.dropPosition === "before" ? targetIndex : targetIndex + 1;
    newOrder.splice(insertIndex, 0, draggedName);

    handleDragEnd();

    try {
      await reorderPages(draggedParent, newOrder);
    } catch {
      // Error already handled by store
    }
  };

  const buildTree = (pages: Page[]) => {
    const rootPages = pages.filter((p) => !p.parent);

    const renderPage = (page: Page, level: number = 0): JSX.Element => {
      const children = pages.filter((p) => p.parent === page.path);
      const hasChildren = children.length > 0;
      const isDropZoneActive = dragState.dropTargetPath === `__after__${page.path}`;
      const canShowDropZone = dragState.draggedPath && 
        dragState.draggedPath !== page.path &&
        pages.find(p => p.path === dragState.draggedPath)?.parent === page.parent;

      return (
        <div key={page.path}>
          <TreeItem
            page={page}
            level={level}
            onCreateChild={onCreateChild}
            onNavigate={onNavigate}
            currentPath={currentPath}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            hasChildren={hasChildren}
          />
          {children.map((child) => renderPage(child, level + 1))}
          {hasChildren && (
            <div
              className={`h-1 transition-colors ${isDropZoneActive ? "bg-sky-500" : ""}`}
              style={{ marginLeft: `${level * 16 + 12}px` }}
              onDragOver={(e) => {
                if (canShowDropZone) {
                  handleDropZoneDragOver(e, page.path);
                }
              }}
              onDragLeave={() => {
                if (dragState.dropTargetPath === `__after__${page.path}`) {
                  setDragState(prev => ({ ...prev, dropTargetPath: null, dropPosition: null }));
                }
              }}
              onDrop={(e) => handleDropZoneDrop(e, page.path)}
            />
          )}
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
