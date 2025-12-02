import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePageStore } from "../store/usePageStore";
import { Breadcrumbs } from "./Breadcrumbs";
import { TitleField } from "./TitleField";
import { ContentEditor } from "./ContentEditor";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { UserMenu } from "./UserMenu";
import { serializeFrontMatter, parseFrontMatter } from "../utils/front-matter";
import { ARIA_LABELS } from "../constants/aria-labels";

interface PageViewProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function PageView({ onToggleSidebar, isSidebarOpen }: PageViewProps = {}) {
  const { "*": pagePath } = useParams();
  const navigate = useNavigate();
  const {
    pages,
    currentPage,
    loadPages,
    loadPage,
    updatePage,
    renamePage,
    deletePage,
    error,
  } = usePageStore();
  const [isAutoFocus, setIsAutoFocus] = useState(false);

  useEffect(() => {
    if (pagePath) {
      setIsAutoFocus(false);
      loadPages().then(() => {
        return loadPage(pagePath);
      }).then(() => {
        if (pagePath.includes("Untitled")) {
          setIsAutoFocus(true);
        }
      });
    }
  }, [pagePath, loadPage, loadPages]);

  useEffect(() => {
    if (currentPage) {
      document.title = `MDZ - ${currentPage.title}`;
    } else {
      document.title = "MDZ";
    }
  }, [currentPage]);

  const handleTitleSave = async (newTitle: string) => {
    if (!currentPage || !pagePath) return;

    const pathParts = pagePath.split("/");
    pathParts[pathParts.length - 1] = newTitle;
    const newPath = pathParts.join("/");

    await renamePage(pagePath, newPath);
    navigate(`/${newPath}`, { replace: true });
  };

  const handleContentSave = async (fullContent: string) => {
    if (!currentPage || !pagePath) return;
    const { frontMatter, content } = parseFrontMatter(fullContent);
    await updatePage(pagePath, content, frontMatter);
  };

  const handleFieldChange = async (fieldName: string, value: unknown) => {
    if (!currentPage || !pagePath) return;
    const updatedFrontMatter = {
      ...currentPage.frontMatter,
      [fieldName]: value,
    };
    await updatePage(pagePath, currentPage.content, updatedFrontMatter);
  };

  const handleDelete = async () => {
    if (!currentPage || !pagePath) return;

    if (!confirm(`Are you sure you want to delete "${currentPage.title}"?`)) {
      return;
    }

    await deletePage(pagePath);

    const allPages = pages.filter((p) => p.path !== pagePath);
    if (allPages.length > 0) {
      const currentIndex = pages.findIndex((p) => p.path === pagePath);
      const nextPage = allPages[Math.max(0, currentIndex - 1)];
      navigate(`/${nextPage.path}`);
    } else {
      navigate("/");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-100 rounded text-slate-700 hover:bg-slate-200"
          aria-label={ARIA_LABELS.toggleSidebar}
          aria-expanded={isSidebarOpen}
        >
          ☰
        </button>
      )}
      
      <header className="flex-shrink-0 px-8 py-4 border-b border-slate-200">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 transition-colors"
            aria-label={ARIA_LABELS.goBack}
            title="Go back"
          >
            ←
          </button>
          {pagePath && <Breadcrumbs pages={pages} currentPath={pagePath} />}
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <TitleField
              title={currentPage.title}
              onSave={handleTitleSave}
              autoFocus={isAutoFocus}
            />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
            aria-label={ARIA_LABELS.deletePage}
            title="Delete current page"
          >
            Delete
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {currentPage && pagePath && (
          <>
            <CustomFieldsPanel
              page={currentPage}
              pages={pages}
              onFieldChange={handleFieldChange}
            />
            <AttachmentsPanel pagePath={pagePath} />
          </>
        )}
        <ContentEditor
          content={serializeFrontMatter(currentPage.frontMatter, currentPage.content)}
          onSave={handleContentSave}
          parentPath={pagePath}
        />
      </main>
    </div>
  );
}

