'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Media } from '@group-cms/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

interface MediaPickerProps {
  companyId: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaPicker({ companyId, onSelect, onClose }: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMedia(companyId).then((m) => {
      setMedia((m as Media[]).filter((item) => item.type === 'image'));
      setLoading(false);
    });
  }, [companyId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = (await api.uploadMedia(companyId, file)) as Media;
      onSelect(`${API_BASE}${uploaded.url}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="font-semibold">Choose Image</h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload New'}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
            <button className="btn-ghost btn-sm p-1" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p>No images yet. Upload one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-all"
                  onClick={() => onSelect(`${API_BASE}${item.url}`)}
                  title={item.originalName}
                >
                  <img
                    src={`${API_BASE}${item.url}`}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
