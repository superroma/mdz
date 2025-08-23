export type Page = { path: string; title: string; content: string };

const API_BASE = "/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      message = j?.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  async tree() {
    const res = await fetch(`${API_BASE}/pages`);
    return handle<any[]>(res);
  },
  async page(path: string) {
    const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(path)}`);
    return handle<Page>(res);
  },
  async create(path: string, content = "", metadata?: any) {
    const res = await fetch(`${API_BASE}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content, metadata }),
    });
    return handle<{ success: boolean }>(res);
  },
  async save(path: string, content: string) {
    const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return handle<{ success: boolean }>(res);
  },
  async rename(path: string, newName: string) {
    const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName }),
    });
    return handle<{ success: boolean }>(res);
  },
  async remove(path: string) {
    const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    return handle<{ success: boolean }>(res);
  },
};
