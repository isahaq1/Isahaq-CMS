"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { api } from "@/lib/api";
import {
  DashboardShell,
  PageHeader,
  LoadingSpinner,
  EmptyState,
} from "@/components/layout/sidebar";
import { formatFileSize } from "@/lib/utils";
import type { Media, Company } from "@group-cms/shared";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:4000";

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCompanies = async () => {
    const c = await api.getCompanies();
    setCompanies(c as Company[]);
    if (c.length > 0) setSelectedCompany(c[0].id);
    setLoading(false);
  };

  const loadMedia = async () => {
    if (!selectedCompany) return;
    const m = await api.getMedia(selectedCompany);
    setMedia(m as Media[]);
  };

  useEffect(() => {
    loadCompanies();
  }, []);
  useEffect(() => {
    if (selectedCompany) loadMedia();
  }, [selectedCompany]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    setUploading(true);
    try {
      await api.uploadMedia(selectedCompany, file);
      loadMedia();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === media.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(media.map((m) => m.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    try {
      for (const id of selectedFiles) {
        await api.deleteMedia(id);
      }
      setSelectedFiles(new Set());
      loadMedia();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading)
    return (
      <DashboardShell>
        <LoadingSpinner />
      </DashboardShell>
    );

  return (
    <DashboardShell>
      <PageHeader
        title="Media Library"
        description="Upload and manage images, videos, and documents"
        actions={
          <div className="flex items-center gap-3">
            <select
              className="input"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />{" "}
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="image/*,video/*,.pdf"
            />
          </div>
        }
      />

      {media.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedFiles.size === media.length && media.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 rounded cursor-pointer"
            title="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selectedFiles.size > 0 && `${selectedFiles.size} file(s) selected`}
          </span>
          {selectedFiles.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="ml-auto px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected
            </button>
          )}
        </div>
      )}

      {media.length === 0 ? (
        <EmptyState
          title="No media files"
          description="Upload images, videos, or documents"
          action={
            <button
              className="btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-4 h-4" /> Upload File
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className={`card overflow-hidden group cursor-pointer transition ${
                selectedFiles.has(item.id) ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => toggleFileSelection(item.id)}
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                {item.type === "image" ? (
                  <img
                    src={`${API_BASE}${item.url}`}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}

                {/* Checkbox overlay */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-md border-2 border-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  {selectedFiles.has(item.id) && (
                    <Check className="w-4 h-4 text-blue-500 font-bold" />
                  )}
                </div>

                {/* Delete button */}
                <button
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this file?")) {
                      api.deleteMedia(item.id).then(() => loadMedia());
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">
                  {item.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
