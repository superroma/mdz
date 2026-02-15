import type { Page } from "../../packages/frontend/src/types";

const MOCK_PAGES: Page[] = [
  {
    path: "Components/task-1",
    title: "Design system audit",
    content: "Review all existing components for consistency.",
    frontMatter: {
      status: "In Progress",
      priority: "High",
      category: "Frontend",
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
  {
    path: "Components/task-2",
    title: "Fix navigation bug",
    content: "Sidebar collapses on small screens.",
    frontMatter: {
      status: "Todo",
      priority: "Medium",
      category: "Frontend",
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
  {
    path: "Components/task-3",
    title: "API rate limiting",
    content: "Implement rate limiting on public endpoints.",
    frontMatter: {
      status: "Todo",
      priority: "High",
      category: "Backend",
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
  {
    path: "Components/task-4",
    title: "Write unit tests",
    content: "Cover filterUtils with tests.",
    frontMatter: {
      status: "Done",
      priority: "Low",
      category: "Frontend",
      due_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
  {
    path: "Components/task-5",
    title: "Database migration",
    content: "Migrate user table to new schema.",
    frontMatter: {
      status: "In Progress",
      priority: "High",
      category: "Backend",
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
  {
    path: "Components/task-6",
    title: "Update docs",
    content: "Document new component API.",
    frontMatter: {
      status: "Done",
      priority: "Low",
      category: "Frontend",
      due_date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
    },
    children: [],
    parent: "Components/README",
    canEdit: true,
  },
];

const MOCK_PARENT_PAGE: Page = {
  path: "Components/README",
  title: "Components",
  content: "",
  frontMatter: {
    __schema: [
      { name: "status", type: "select", options: ["Todo", "In Progress", "Done"] },
      { name: "priority", type: "select", options: ["Low", "Medium", "High"] },
      { name: "category", type: "select", options: ["Frontend", "Backend"] },
      { name: "due_date", type: "date" },
    ],
  },
  children: MOCK_PAGES.map((p) => p.path),
};

export async function listPages(): Promise<Page[]> {
  return [MOCK_PARENT_PAGE, ...MOCK_PAGES];
}

export async function getPage(path: string): Promise<Page> {
  const all = await listPages();
  const page = all.find((p) => p.path === path);
  if (!page) throw new Error(`Page not found: ${path}`);
  return page;
}

export function getAuthToken() {
  return null;
}
export function setAuthToken() {}
export function removeAuthToken() {}
export async function createPage() {
  return MOCK_PAGES[0];
}
export async function updatePage() {
  return MOCK_PAGES[0];
}
export async function renamePage() {
  return MOCK_PAGES[0];
}
export async function deletePage() {}
export async function listFiles() {
  return { files: [] };
}
export async function uploadFile() {
  return { name: "test.txt", size: 0, uploadDate: "" };
}
export async function deleteFile() {}
export function getFileUrl() {
  return "";
}
export async function getAuthProviders() {
  return { providers: [] };
}
export async function getCurrentUser() {
  return { email: "test@example.com", provider: "local", groups: [] };
}
export async function logout() {}
export async function savePageOrder() {}
