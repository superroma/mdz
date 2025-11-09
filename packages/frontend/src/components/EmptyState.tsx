export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-slate-400 text-lg mb-2">No page selected</p>
        <p className="text-slate-500 text-sm">
          Select a page from the sidebar or create a new one
        </p>
      </div>
    </div>
  );
}

