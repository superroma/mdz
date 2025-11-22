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
    showHidden,
    loadPages,
    createPage,
    toggleSidebar,
    toggleShowHidden,
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
    <div className="relative flex h-screen bg-white text-slate-900 overflow-hidden">
      {/* Sidebar - underneath everything */}
      <Sidebar
        pages={pages}
        onCreateRoot={handleCreateRoot}
        onCreateChild={handleCreateChild}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        showHidden={showHidden}
        onToggleShowHidden={toggleShowHidden}
      />
      
      {/* Page view container - slides to the right on mobile */}
      <div 
        className={`
          flex-1 flex flex-col h-full
          md:ml-0
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-[280px]" : "translate-x-0"}
          md:translate-x-0
          bg-white
          relative
        `}
      >
        <Routes>
          <Route path="/" element={<RedirectToFirstPage />} />
          <Route path="/*" element={<PageView onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
        </Routes>
      </div>
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

