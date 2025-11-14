import { TreeNavigation } from "./TreeNavigation";
import type { Page } from "../types";

interface SidebarProps {
  pages: Page[];
  onCreateRoot: () => void;
  onCreateChild: (parent: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({
  pages,
  onCreateRoot,
  onCreateChild,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
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
          bg-slate-800 border-r border-slate-700 
          flex flex-col
          transition-transform duration-300 ease-in-out
        `}
        aria-label="Page navigation sidebar"
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Pages</h2>
          <button
            type="button"
            onClick={onCreateRoot}
            className="text-slate-400 hover:text-slate-200 text-xl px-2 py-1 leading-none"
            aria-label="Create new page"
            title="Create new page"
            data-testid="create-root-page-button"
          >
            +
          </button>
        </div>
        <TreeNavigation 
          pages={pages} 
          onCreateChild={onCreateChild}
          onNavigate={onClose}
        />
      </aside>
    </>
  );
}
