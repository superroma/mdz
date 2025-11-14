import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { usePageStore } from "./store/usePageStore";
import { Sidebar } from "./components/Sidebar";
import { PageView } from "./components/PageView";
import { EmptyState } from "./components/EmptyState";

function RedirectToFirstPage() {
  const { pages, loadPages } = usePageStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (pages.length > 0) {
      const firstPage = pages.find((p) => !p.parent) || pages[0];
      navigate(`/${firstPage.path}`, { replace: true });
    }
  }, [pages, navigate]);

  return <EmptyState />;
}

function AppContent() {
  const {
    pages,
    isSidebarOpen,
    loadPages,
    createPage,
    toggleSidebar,
  } = usePageStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleCreateRoot = async () => {
    const page = await createPage();
    navigate(`/${page.path}`);
  };

  const handleCreateChild = async (parent: string) => {
    const page = await createPage(parent);
    navigate(`/${page.path}`);
  };

  return (
    <div className="flex h-screen bg-white text-slate-900">
      <button
        type="button"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-100 rounded text-slate-700 hover:bg-slate-200"
        aria-label="Toggle sidebar"
        aria-expanded={isSidebarOpen}
        data-testid="toggle-sidebar-button"
      >
        ☰
      </button>
      <Sidebar
        pages={pages}
        onCreateRoot={handleCreateRoot}
        onCreateChild={handleCreateChild}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      <Routes>
        <Route path="/" element={<RedirectToFirstPage />} />
        <Route path="/*" element={<PageView />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

