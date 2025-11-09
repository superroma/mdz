import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MDXContent } from "./MDXContent";
import * as api from "../api/client";

// Mock the API client
vi.mock("../api/client", () => ({
  getFileUrl: vi.fn((pagePath: string, filename: string) => 
    `http://localhost:3001/api/files/${pagePath}/${filename}`
  ),
}));

// Wrapper component with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("MDXContent", () => {
  it("resolves relative image paths", async () => {
    const content = "![Logo](./logo.png)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "http://localhost:3001/api/files/Welcome/logo.png");
    });
  });

  it("resolves relative image paths without ./ prefix", async () => {
    const content = "![Logo](logo.png)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "http://localhost:3001/api/files/Welcome/logo.png");
    });
  });

  it("resolves absolute paths from pages root", async () => {
    const content = "![Logo](/Welcome/logo.png)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "http://localhost:3001/api/files/Welcome/logo.png");
    });
  });

  it("resolves parent directory paths", async () => {
    const content = "![Logo](../logo.png)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome/Tasks" />);
    
    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "http://localhost:3001/api/files/Welcome/logo.png");
    });
  });

  it("preserves absolute URLs", async () => {
    const content = "![Logo](https://example.com/logo.png)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    });
  });

  // Note: HTML img tags in MDX may not be processed through the custom component.
  // Users should use markdown syntax: ![alt](./logo.png) instead of <img> tags.
  // The rehype plugin handles markdown images correctly.
});

describe("MDXContent - Link Resolution", () => {
  it("resolves .md file links to in-app navigation paths", async () => {
    const content = "[Task](./Task.md)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Task");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome/Task");
    });
  });

  it("resolves README.md links to parent directory", async () => {
    const content = "[Tasks](./Tasks/README.md)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Tasks");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome/Tasks");
    });
  });

  it("resolves relative .md links with spaces and encodes URLs", async () => {
    // Markdown requires URL encoding for spaces or angle brackets around URLs with spaces
    const content = "[Guide](./Markdown%20Guide.md)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Guide");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome/Markdown%20Guide");
    });
  });

  it("resolves parent directory .md links", async () => {
    const content = "[Welcome](../README.md)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome/Tasks" />);
    
    await waitFor(() => {
      const link = screen.getByText("Welcome");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome");
    });
  });

  it("resolves absolute path .md links", async () => {
    const content = "[Welcome](/Welcome/README.md)";
    renderWithRouter(<MDXContent content={content} parentPath="Tasks" />);
    
    await waitFor(() => {
      const link = screen.getByText("Welcome");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome");
    });
  });

  it("converts non-.md file links to backend URLs with external attributes", async () => {
    const content = "[PDF](./document.pdf)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("PDF");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "http://localhost:3001/api/files/Welcome/document.pdf");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("preserves external links with security attributes", async () => {
    const content = "[Example](https://example.com)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Example");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("preserves anchor links without modification", async () => {
    const content = "[Section](#section)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Section");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "#section");
      expect(link).not.toHaveAttribute("target");
    });
  });

  it("resolves directory links without .md extension as page links", async () => {
    const content = "[Tasks](./Tasks)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Tasks");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome/Tasks");
    });
  });

  it("handles markdown links with spaces using angle brackets", async () => {
    const content = "[Guide](<./Markdown Guide.md>)";
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const link = screen.getByText("Guide");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Welcome/Markdown%20Guide");
    });
  });

  it("resolves multiple directory links correctly (Welcome page scenario)", async () => {
    const content = `
- [Markdown Guide](<./Markdown Guide.md>)
- [Tasks](./Tasks)
- [Projects](./Projects)
    `;
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const guideLink = screen.getByText("Markdown Guide");
      const tasksLink = screen.getByText("Tasks");
      const projectsLink = screen.getByText("Projects");
      
      expect(guideLink).toHaveAttribute("href", "/Welcome/Markdown%20Guide");
      expect(tasksLink).toHaveAttribute("href", "/Welcome/Tasks");
      expect(projectsLink).toHaveAttribute("href", "/Welcome/Projects");
      
      // All should be in-app navigation links (not external)
      expect(guideLink).toHaveAttribute("data-md-link", "true");
      expect(tasksLink).toHaveAttribute("data-md-link", "true");
      expect(projectsLink).toHaveAttribute("data-md-link", "true");
    });
  });

  it("distinguishes between page links and file links by extension", async () => {
    const content = `
- [Page without extension](./MyPage)
- [Page with .md](./MyPage.md)
- [PDF file](./document.pdf)
- [Image file](./photo.jpg)
    `;
    renderWithRouter(<MDXContent content={content} parentPath="Welcome" />);
    
    await waitFor(() => {
      const pageNoExt = screen.getByText("Page without extension");
      const pageMd = screen.getByText("Page with .md");
      const pdfFile = screen.getByText("PDF file");
      const imgFile = screen.getByText("Image file");
      
      // Pages should navigate in-app
      expect(pageNoExt).toHaveAttribute("href", "/Welcome/MyPage");
      expect(pageNoExt).toHaveAttribute("data-md-link", "true");
      
      expect(pageMd).toHaveAttribute("href", "/Welcome/MyPage");
      expect(pageMd).toHaveAttribute("data-md-link", "true");
      
      // Files should open externally
      expect(pdfFile).toHaveAttribute("href", "http://localhost:3001/api/files/Welcome/document.pdf");
      expect(pdfFile).toHaveAttribute("data-external", "true");
      expect(pdfFile).toHaveAttribute("target", "_blank");
      
      expect(imgFile).toHaveAttribute("href", "http://localhost:3001/api/files/Welcome/photo.jpg");
      expect(imgFile).toHaveAttribute("data-external", "true");
      expect(imgFile).toHaveAttribute("target", "_blank");
    });
  });

  it("handles nested directory paths without extensions", async () => {
    const content = "[Nested Page](./Welcome/Tasks/MyTask)";
    renderWithRouter(<MDXContent content={content} parentPath="Root" />);
    
    await waitFor(() => {
      const link = screen.getByText("Nested Page");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/Root/Welcome/Tasks/MyTask");
      expect(link).toHaveAttribute("data-md-link", "true");
    });
  });
});

