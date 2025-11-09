import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePageStore } from "../store/usePageStore";
import { Breadcrumbs } from "./Breadcrumbs";
import { TitleField } from "./TitleField";
import { ContentEditor } from "./ContentEditor";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { serializeFrontMatter, parseFrontMatter } from "../utils/front-matter";

export function PageView() {
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
          <p className="text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
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
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-8 py-4 border-b border-slate-700">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            ←
          </button>
          {pagePath && <Breadcrumbs pages={pages} currentPath={pagePath} />}
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
            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
            aria-label="Delete page"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
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
      </div>
    </div>
  );
}

