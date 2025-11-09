import { useState, useEffect } from "react";
import type { FileInfo } from "../api/client";
import * as api from "../api/client";

interface AttachmentsPanelProps {
  pagePath: string;
  onFileChange?: () => void;
}

export function AttachmentsPanel({ pagePath, onFileChange }: AttachmentsPanelProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const loadFiles = async () => {
    try {
      const result = await api.listFiles(pagePath);
      setFiles(result.files);
    } catch (error) {
      console.error("Failed to load files:", error);
    }
  };
  
  useEffect(() => {
    loadFiles();
  }, [pagePath]);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        await api.uploadFile(pagePath, file);
      }
      await loadFiles();
      onFileChange?.();
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  
  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    
    try {
      await api.deleteFile(pagePath, filename);
      await loadFiles();
      onFileChange?.();
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="mb-4 border border-slate-700 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-800 transition-colors rounded-t-lg"
      >
        <span className="text-sm font-medium text-slate-300">Attachments</span>
        <span className="text-slate-400">{isExpanded ? "−" : "+"}</span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-3 border-t border-slate-700">
          <div>
            <label className="block mb-2">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <span className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded cursor-pointer transition-colors disabled:opacity-50">
                {isUploading ? "Uploading..." : "Upload Files"}
              </span>
            </label>
          </div>
          
          {files.length === 0 ? (
            <p className="text-sm text-slate-400">No attachments</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-2 bg-slate-800 rounded"
                >
                  <a
                    href={api.getFileUrl(pagePath, file.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-sky-400 hover:text-sky-300 truncate"
                  >
                    {file.name}
                  </a>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-xs text-slate-400">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(file.name)}
                      className="text-xs text-red-400 hover:text-red-300"
                      aria-label={`Delete ${file.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

