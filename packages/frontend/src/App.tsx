import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { usePageStore } from "./store/usePageStore";
import { useAuthStore } from "./store/useAuthStore";
import { Sidebar } from "./components/Sidebar";
import { PageView } from "./components/PageView";
import { EmptyState } from "./components/EmptyState";
import { LoginPage } from "./components/LoginPage";
import { AuthCallback } from "./components/AuthCallback";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = window.location.pathname;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem("auth_redirect", location);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
      <Sidebar
        pages={pages}
        onCreateRoot={handleCreateRoot}
        onCreateChild={handleCreateChild}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        showHidden={showHidden}
        onToggleShowHidden={toggleShowHidden}
      />
      
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

