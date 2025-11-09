export interface Page {
  path: string;
  title: string;
  content: string;
  frontMatter: Record<string, unknown>;
  children: string[];
  parent?: string;
}

export interface CreatePageRequest {
  path?: string;
  content?: string;
  parent?: string;
  frontMatter?: Record<string, unknown>;
}

export interface UpdatePageRequest {
  content: string;
  frontMatter?: Record<string, unknown>;
}

export interface RenamePageRequest {
  newPath: string;
}

