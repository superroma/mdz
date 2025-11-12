import { useMemo, useEffect, useState } from "react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { Progress } from "./Progress";
import { BoardView } from "./views/BoardView";
import { GridView } from "./views/GridView";
import { CalendarView } from "./views/CalendarView";
import { ListView } from "./views/ListView";
import { Tabs, Tab } from "./views/Tabs";
import { getFileUrl } from "../api/client";

interface MDXContentProps {
  content: string;
  parentPath?: string;
  onCheckboxToggle?: (lineIndex: number) => void;
}

// Resolve relative path against parent path
const resolvePath = (path: string, parentPath?: string): string => {
  if (!parentPath) return path;

  const parentPathParts = parentPath.split("/");

  if (path.startsWith("./")) {
    // Same directory: ./file -> parentPath/file
    return parentPath + "/" + path.slice(2);
  }

  if (path.startsWith("../")) {
    // Parent directory: ../file -> go up one level
    let currentPathParts = [...parentPathParts];
    let remainingPath = path;

    while (remainingPath.startsWith("../")) {
      currentPathParts.pop();
      remainingPath = remainingPath.slice(3);
    }

    return currentPathParts.join("/") + "/" + remainingPath;
  }

  // No prefix, treat as same directory
  return parentPath + "/" + path;
};

const resolveImageUrl = (src: string, parentPath?: string): string => {
  if (!parentPath) return src;

  // If it's already an absolute URL (http/https), return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // If it's an absolute path from pages root (starts with /)
  if (src.startsWith("/")) {
    const pathWithoutLeadingSlash = src.slice(1);
    const pathParts = pathWithoutLeadingSlash.split("/");
    const filename = pathParts.pop();
    const pagePath = pathParts.join("/");
    if (filename) {
      return getFileUrl(pagePath, filename);
    }
    return src;
  }

  // Resolve relative path
  const resolved = resolvePath(src, parentPath);
  const pathParts = resolved.split("/");
  const filename = pathParts.pop();
  const pagePath = pathParts.join("/");
  if (filename) {
    return getFileUrl(pagePath, filename);
  }
  return src;
};

const resolveLinkUrl = (
  href: string,
  parentPath?: string
): { url: string; isExternal: boolean; isMdLink: boolean } => {
  // External URLs - pass through unchanged
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//")
  ) {
    return { url: href, isExternal: true, isMdLink: false };
  }

  // Anchor links (#section)
  if (href.startsWith("#")) {
    return { url: href, isExternal: false, isMdLink: false };
  }

  if (!parentPath) {
    return { url: href, isExternal: false, isMdLink: false };
  }

  // Handle absolute paths from pages root (starts with /)
  let resolvedPath = href;
  if (href.startsWith("/")) {
    resolvedPath = href.slice(1);
  } else {
    // Resolve relative path
    resolvedPath = resolvePath(href, parentPath);
  }

  // Check if it's a .md file link or a directory link (potential page)
  const isMdFile = resolvedPath.endsWith(".md");
  const hasExtension = /\.\w+$/.test(resolvedPath);

  // Treat as page link if: ends with .md OR no extension (likely a directory/page reference)
  if (isMdFile || !hasExtension) {
    // Strip .md extension if present
    let pagePath = isMdFile ? resolvedPath.slice(0, -3) : resolvedPath;

    // Handle README.md specially - navigate to parent directory
    if (pagePath.endsWith("/README")) {
      pagePath = pagePath.slice(0, -7);
    }

    // Split path and encode each segment to avoid double-encoding
    const segments = pagePath.split("/");
    const encodedSegments = segments.map((segment) => {
      // Decode first in case it's already encoded, then encode
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        // If decoding fails, just encode
        return encodeURIComponent(segment);
      }
    });
    const encodedPath = "/" + encodedSegments.join("/");
    return { url: encodedPath, isExternal: false, isMdLink: true };
  }

  // Has extension but not .md - treat as file link, convert to backend file URL
  const pathParts = resolvedPath.split("/");
  const filename = pathParts.pop();
  const pagePath = pathParts.join("/");
  if (filename) {
    const fileUrl = getFileUrl(pagePath, filename);
    return { url: fileUrl, isExternal: true, isMdLink: false };
  }

  return { url: href, isExternal: false, isMdLink: false };
};

const createMdxComponents = (
  parentPath?: string,
  navigate?: ReturnType<typeof useNavigate>,
  onCheckboxToggle?: (lineIndex: number) => void
) => ({
  Progress,
  BoardView: (props: React.ComponentProps<typeof BoardView>) => (
    <BoardView {...props} parentPath={parentPath} />
  ),
  GridView: (props: React.ComponentProps<typeof GridView>) => (
    <GridView {...props} parentPath={parentPath} />
  ),
  CalendarView: (props: React.ComponentProps<typeof CalendarView>) => (
    <CalendarView {...props} parentPath={parentPath} />
  ),
  ListView: (props: React.ComponentProps<typeof ListView>) => (
    <ListView {...props} parentPath={parentPath} />
  ),
  Tabs,
  Tab,
  a: (
    props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      "data-md-link"?: string;
      "data-external"?: string;
    }
  ) => {
    const href = props.href || "";
    const isMdLink = props["data-md-link"] === "true";
    const isExternal = props["data-external"] === "true";

    // For in-app .md navigation, use navigate
    if (isMdLink && navigate) {
      return (
        <a
          {...props}
          onClick={(e) => {
            e.preventDefault();
            navigate(href);
            props.onClick?.(e);
          }}
        />
      );
    }

    // For external links and files, open in new tab
    if (isExternal) {
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    }

    // For anchor links, default behavior
    return <a {...props} />;
  },
  input: (
    props: React.InputHTMLAttributes<HTMLInputElement> & {
      "data-line-index"?: string;
    }
  ) => {
    // Only handle task list checkboxes (those with data-line-index)
    const lineIndexStr = props["data-line-index"];
    const isTaskListCheckbox =
      lineIndexStr !== undefined && props.type === "checkbox";

    if (isTaskListCheckbox && onCheckboxToggle) {
      const lineIndex = parseInt(lineIndexStr, 10);
      // Remove disabled from props to ensure checkbox is interactive
      const { disabled, ...restProps } = props;
      return (
        <input
          {...restProps}
          disabled={false}
          onClick={(e) => {
            // Call the toggle handler with the line index
            // Don't prevent default - let checkbox toggle visually, markdown will update
            onCheckboxToggle(lineIndex);
            props.onClick?.(e);
          }}
        />
      );
    }

    // For all other inputs, use default behavior
    return <input {...props} />;
  },
});

export function MDXContent({
  content,
  parentPath,
  onCheckboxToggle,
}: MDXContentProps) {
  const navigate = useNavigate();
  const [MDXComponent, setMDXComponent] = useState<React.ComponentType | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const mdxComponents = useMemo(
    () => createMdxComponents(parentPath, navigate, onCheckboxToggle),
    [parentPath, navigate, onCheckboxToggle]
  );

  useEffect(() => {
    let isCancelled = false;

    // Reset component state when content changes
    setMDXComponent(null);
    setError(null);

    async function compileMDX() {
      try {
        // Create rehype plugin to transform paths and add checkbox line indices
        const rehypeTransformPaths = (
          parentPath?: string,
          markdownContent?: string
        ) => {
          return () => {
            return (tree: any) => {
              // Get all checkbox lines from markdown
              const lines = markdownContent?.split("\n") || [];
              const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+(.+)$/;
              const checkboxes: Array<{
                line: number;
                text: string;
                checked: boolean;
              }> = [];

              lines.forEach((line, index) => {
                const match = line.match(checkboxRegex);
                if (match) {
                  const text = match[3].trim();
                  const checked = match[2] === "x";
                  checkboxes.push({ line: index, text, checked });
                }
              });

              let checkboxCounter = 0;

              const visit = (node: any, parent?: any) => {
                if (!node || typeof node !== "object") return;

                // Transform img src attributes
                if (
                  node.type === "element" &&
                  node.tagName === "img" &&
                  node.properties?.src
                ) {
                  const src = node.properties.src as string;
                  node.properties.src = resolveImageUrl(src, parentPath);
                }

                // Transform anchor href attributes
                if (
                  node.type === "element" &&
                  node.tagName === "a" &&
                  node.properties?.href
                ) {
                  const href = node.properties.href as string;
                  const resolved = resolveLinkUrl(href, parentPath);
                  node.properties.href = resolved.url;

                  // Add data attributes to help the custom component
                  if (resolved.isMdLink) {
                    node.properties["data-md-link"] = "true";
                  }
                  if (resolved.isExternal) {
                    node.properties["data-external"] = "true";
                  }
                }

                // Handle task list checkboxes
                if (
                  node.type === "element" &&
                  node.tagName === "input" &&
                  node.properties?.type === "checkbox"
                ) {
                  // Remove disabled attribute to make checkboxes interactive
                  delete node.properties.disabled;

                  // Match checkboxes sequentially - every checkbox element maps to its position
                  // in the list of checkboxes, regardless of checked state
                  if (checkboxCounter < checkboxes.length) {
                    node.properties["data-line-index"] = String(
                      checkboxes[checkboxCounter].line
                    );
                    checkboxCounter++;
                  }
                }

                if (Array.isArray(node.children)) {
                  node.children.forEach((child) => visit(child, node));
                }
              };

              if (tree) {
                visit(tree);
              }

              return tree;
            };
          };
        };

        // Compile MDX to JavaScript
        // Note: position information is preserved from remark -> rehype with this config
        const compiled = await compile(content, {
          outputFormat: "function-body",
          development: false,
          // Use remark-gfm for GitHub-flavored markdown
          remarkPlugins: [(await import("remark-gfm")).default],
          rehypePlugins: [rehypeTransformPaths(parentPath, content)],
          // Preserve position information from source
          SourceMapGenerator: undefined,
        });

        if (isCancelled) return;

        // Run the compiled code
        // Security: Using outputFormat: "function-body" prevents dynamic imports
        // All components are provided via the components prop, not dynamically imported
        const { default: Component } = await run(String(compiled), {
          ...runtime,
          baseUrl: import.meta.url,
        });

        if (!isCancelled) {
          setMDXComponent(() => Component);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("MDX compilation error:", err);
          setError(
            err instanceof Error ? err.message : "Failed to compile MDX"
          );
        }
      }
    }

    compileMDX();

    return () => {
      isCancelled = true;
    };
  }, [content]);

  if (error) {
    return (
      <div className="text-red-400 p-4 border border-red-800 rounded">
        <strong>MDX Error:</strong> {error}
      </div>
    );
  }

  if (!MDXComponent) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return <MDXComponent components={mdxComponents} />;
}
