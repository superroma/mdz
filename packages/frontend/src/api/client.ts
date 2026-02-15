import type {
  Page,
  CreatePageRequest,
  UpdatePageRequest,
  RenamePageRequest,
} from "../types";

// In production, use relative URLs since backend serves both frontend and API
// In development, VITE_API_URL should be set to http://localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("auth_token");
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const json = JSON.parse(text);
      if (json.error) {
        message = json.error;
      }
    } catch {
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }
  return response.json();
}

export async function listPages(): Promise<Page[]> {
  const response = await fetch(`${API_BASE_URL}/api/pages`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Page[]>(response);
}

export async function getPage(path: string): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Page>(response);
}

export async function createPage(data: CreatePageRequest): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
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
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
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
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Page>(response);
}

export async function deletePage(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
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
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<{ files: FileInfo[] }>(response);
}

export async function uploadFile(pagePath: string, file: File): Promise<FileInfo> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse<FileInfo>(response);
}

export async function deleteFile(pagePath: string, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/files/${pagePath}/${filename}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
  }
}

export function getFileUrl(pagePath: string, filename: string): string {
  return `${API_BASE_URL}/api/files/${pagePath}/${filename}`;
}

export interface AuthProvider {
  name: string;
  displayName: string;
}

export interface AuthProvidersResponse {
  providers: AuthProvider[];
}

export interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: string;
  groups: string[];
}

export async function getAuthProviders(): Promise<AuthProvidersResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/providers`);
  return handleResponse<AuthProvidersResponse>(response);
}

export async function getCurrentUser(): Promise<User> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<User>(response);
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  removeAuthToken();
}

export async function savePageOrder(parent: string | null, order: string[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pages-order`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ parent, order }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
  }
}

