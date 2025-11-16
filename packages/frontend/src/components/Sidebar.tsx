import { TreeNavigation } from "./TreeNavigation";
import type { Page } from "../types";

interface SidebarProps {
  pages: Page[];
  onCreateRoot: () => void;
  onCreateChild: (parent: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  showHidden: boolean;
  onToggleShowHidden: () => void;
}

export function Sidebar({
  pages,
  onCreateRoot,
  onCreateChild,
  isOpen,
  onClose,
  showHidden,
  onToggleShowHidden,
}: SidebarProps) {
  // Filter pages based on showHidden state
  // Hide both hidden files (starting with .) and non-markdown files when showHidden is false
  const filteredPages = showHidden 
    ? pages 
    : pages.filter(page => !page.isHidden && page.isMarkdown !== false);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
          fixed md:relative 
          z-40 md:z-0
          w-[280px] h-full 
          bg-slate-50 border-r border-slate-200 
          flex flex-col
          transition-transform duration-300 ease-in-out
        `}
        aria-label="Page navigation sidebar"
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Pages</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleShowHidden}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showHidden 
                  ? "bg-slate-300 text-slate-800" 
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
              aria-label="Toggle hidden files"
              title={showHidden ? "Hide hidden files" : "Show hidden files"}
              data-testid="toggle-hidden-button"
            >
              {showHidden ? "👁️" : "👁️‍🗨️"}
            </button>
            <button
              type="button"
              onClick={onCreateRoot}
              className="text-slate-600 hover:text-slate-900 text-xl px-2 py-1 leading-none"
              aria-label="Create new page"
              title="Create new page"
              data-testid="create-root-page-button"
            >
              +
            </button>
          </div>
        </div>
        <TreeNavigation 
          pages={filteredPages} 
          onCreateChild={onCreateChild}
          onNavigate={onClose}
        />
      </aside>
    </>
  );
}
