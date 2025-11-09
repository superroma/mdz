import type {
  Page,
  CreatePageRequest,
  UpdatePageRequest,
  RenamePageRequest,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function listPages(): Promise<Page[]> {
  const response = await fetch(`${API_BASE_URL}/api/pages`);
  return handleResponse<Page[]>(response);
}

export async function getPage(path: string): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`);
  return handleResponse<Page>(response);
}

export async function createPage(data: CreatePageRequest): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Page>(response);
}

export async function updatePage(
  path: string,
  data: UpdatePageRequest
): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Page>(response);
}

export async function renamePage(
  path: string,
  data: RenamePageRequest
): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Page>(response);
}

export async function deletePage(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
  }
}

export interface FileInfo {
  name: string;
  size: number;
  uploadDate: string;
}

export async function listFiles(pagePath: string): Promise<{ files: FileInfo[] }> {
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}`);
  return handleResponse<{ files: FileInfo[] }>(response);
}

export async function uploadFile(pagePath: string, file: File): Promise<FileInfo> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<FileInfo>(response);
}

export async function deleteFile(pagePath: string, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}/${filename}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
  }
}

export function getFileUrl(pagePath: string, filename: string): string {
  return `${API_BASE_URL}/api/files/${pagePath}/${filename}`;
}

