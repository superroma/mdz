import { resolve, relative, normalize, extname } from "node:path";
import { ForbiddenError, ValidationError } from "../errors.js";

export const DEFAULT_PAGES_ROOT = "../../pages";

export function getPagesRoot(): string {
  const root = process.env.PAGES_ROOT ?? DEFAULT_PAGES_ROOT;
  return resolve(root);
}

export function validatePath(userPath: string): {
  valid: boolean;
  resolvedPath: string;
  error?: string;
} {
  const pagesRoot = getPagesRoot();

  try {
    const normalized = normalize(userPath);
    const resolved = resolve(pagesRoot, normalized);
    const relativePath = relative(pagesRoot, resolved);

    if (relativePath.startsWith("..") || relativePath.includes("..")) {
      return {
        valid: false,
        resolvedPath: resolved,
        error: "Path traversal detected",
      };
    }

    if (!resolved.startsWith(pagesRoot)) {
      return {
        valid: false,
        resolvedPath: resolved,
        error: "Path outside pages root",
      };
    }

    return {
      valid: true,
      resolvedPath: resolved,
    };
  } catch (error) {
    return {
      valid: false,
      resolvedPath: "",
      error: `Invalid path: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export function validatePathOrThrow(userPath: string): string {
  const validation = validatePath(userPath);
  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }
  return validation.resolvedPath;
}

export function validateFilename(filename: string): {
  valid: boolean;
  error?: string;
} {
  if (filename.includes("..")) {
    return {
      valid: false,
      error: "Filename cannot contain ..",
    };
  }

  if (filename.includes("/") || filename.includes("\\")) {
    return {
      valid: false,
      error: "Filename cannot contain path separators",
    };
  }

  if (!filename || filename.trim().length === 0) {
    return {
      valid: false,
      error: "Filename cannot be empty",
    };
  }

  return { valid: true };
}

export function validateFilenameOrThrow(filename: string): void {
  const validation = validateFilename(filename);
  if (!validation.valid) {
    throw new ValidationError(validation.error || "Invalid filename");
  }
}

// Whitelist of safe file extensions for uploads and serving
// This prevents dangerous file types like executables, scripts, and macros
const ALLOWED_FILE_EXTENSIONS = new Set([
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".bmp",
  // Documents
  ".pdf",
  ".txt",
  ".md",
  ".html",
  ".htm",
  ".css",
  ".json",
  ".xml",
  // Office documents - Microsoft Office
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  // Office documents - OpenDocument
  ".odt",
  ".ods",
  ".odp",
  // Other document formats
  ".rtf",
  ".csv",
  ".cdr",
  ".ai",
  ".eps",
  ".psd",
  ".svg",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  // Archives (read-only, not extracted)
  ".zip",
  ".tar",
  ".gz",
  // Audio
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".flac",
  // Video
  ".mp4",
  ".webm",
  ".ogv",
  ".mov",
  ".avi",
]);

export function validateFileExtension(filename: string): {
  valid: boolean;
  error?: string;
} {
  const ext = extname(filename).toLowerCase();

  // Files without extensions are not allowed
  if (!ext || ext === filename) {
    return {
      valid: false,
      error: "File must have a valid extension",
    };
  }

  // Check against whitelist
  if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is not allowed. Only safe file types are permitted.`,
    };
  }

  return { valid: true };
}

export function validateFileExtensionOrThrow(filename: string): void {
  const validation = validateFileExtension(filename);
  if (!validation.valid) {
    throw new ValidationError(validation.error || "Invalid file extension");
  }
}
