import { TreeNavigation } from "./TreeNavigation";
import type { Page } from "../types";

interface SidebarProps {
  pages: Page[];
  onCreateRoot: () => void;
  onCreateChild: (parent: string) => void;
  isOpen: boolean;
}

export function Sidebar({
  pages,
  onCreateRoot,
  onCreateChild,
  isOpen,
}: SidebarProps) {
  return (
    <aside
      className={`
        ${isOpen ? "block" : "hidden"} 
        md:block w-full md:w-[280px] h-full bg-slate-800 border-r border-slate-700 flex flex-col
      `}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">Pages</h2>
        <button
          type="button"
          onClick={onCreateRoot}
          className="text-slate-400 hover:text-slate-200 text-xl px-2 py-1 leading-none"
          aria-label="Create new page"
          title="Create new page"
        >
          +
        </button>
      </div>
      <TreeNavigation pages={pages} onCreateChild={onCreateChild} />
    </aside>
  );
}
