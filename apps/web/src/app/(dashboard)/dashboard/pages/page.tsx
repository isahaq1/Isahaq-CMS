'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Layout, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import { PageBuilder } from '@/components/builder/page-builder';
import { cn } from '@/lib/utils';
import type { Page, Site, PageBlock } from '@group-cms/shared';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormState {
  title: string;
  slug: string;
  isHomePage: boolean;
}

interface FormErrors {
  title?: string;
  slug?: string;
  general?: string;
}

function CreatePageModal({
  siteId,
  onCreated,
  onClose,
}: {
  siteId: string;
  onCreated: (page: Page) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({ title: '', slug: '', isHomePage: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManual ? prev.slug : slugify(title),
    }));
    if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug }));
    if (errors.slug) setErrors((e) => ({ ...e, slug: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Page title is required';
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      e.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const page = await api.createPage({
        siteId,
        title: form.title.trim(),
        slug: form.slug || slugify(form.title),
        isHomePage: form.isHomePage,
        blocks: [],
      }) as Page;
      onCreated(page);
    } catch (err) {
      const apiErr = err as Error & { details?: Record<string, string[]> };
      if (apiErr.details) {
        setErrors({
          title: apiErr.details.title?.[0],
          slug: apiErr.details.slug?.[0],
          general: Object.keys(apiErr.details).length === 0 ? apiErr.message : undefined,
        });
      } else {
        setErrors({ general: apiErr.message || 'Failed to create page' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">New Page</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* General error banner */}
          {errors.general && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="label">Page Title <span className="text-red-500">*</span></label>
            <input
              className={cn('input', errors.title && 'border-red-400 focus:ring-red-400')}
              placeholder="e.g. About Us"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="label">
              Slug
              <span className="ml-1 text-xs font-normal text-muted-foreground">(auto-generated from title)</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="flex items-center px-3 h-10 bg-gray-50 border border-r-0 border-input rounded-l-lg text-sm text-muted-foreground">/</span>
              <input
                className={cn('input rounded-l-none', errors.slug && 'border-red-400 focus:ring-red-400')}
                placeholder="page-slug"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
            </div>
            {errors.slug && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.slug}
              </p>
            )}
            {!errors.slug && form.slug && (
              <p className="text-xs text-muted-foreground">Page will be at: /{form.slug}</p>
            )}
          </div>

          {/* Home page toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={form.isHomePage}
              onChange={(e) => setForm((prev) => ({ ...prev, isHomePage: e.target.checked }))}
            />
            <div>
              <span className="text-sm font-medium">Set as home page</span>
              <p className="text-xs text-muted-foreground">This page will be shown at the root URL</p>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create Page'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  const loadSites = useCallback(async () => {
    const s = await api.getSites();
    setSites(s as Site[]);
    if ((s as Site[]).length > 0 && !selectedSite) setSelectedSite((s as Site[])[0].id);
    setLoading(false);
  }, [selectedSite]);

  const loadPages = useCallback(async () => {
    if (!selectedSite) return;
    const p = await api.getPages(selectedSite);
    setPages(p as Page[]);
  }, [selectedSite]);

  useEffect(() => { loadSites(); }, []);
  useEffect(() => { if (selectedSite) loadPages(); }, [selectedSite]);

  const togglePublish = async (page: Page) => {
    await api.updatePage(page.id, { isPublished: !page.isPublished });
    loadPages();
  };

  const handleCreated = (page: Page) => {
    setShowModal(false);
    setEditingPage(page);
    loadPages();
  };

  if (editingPage) {
    const companyId = sites.find((s) => s.id === selectedSite)?.companyId;
    return (
      <PageBuilder
        pageId={editingPage.id}
        initialBlocks={editingPage.blocks as PageBlock[]}
        pageTitle={editingPage.title}
        companyId={companyId}
        siteId={selectedSite}
        onBack={() => { setEditingPage(null); loadPages(); }}
      />
    );
  }

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      {showModal && selectedSite && (
        <CreatePageModal
          siteId={selectedSite}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}

      <PageHeader
        title="Pages"
        description="Build and manage website pages with drag-and-drop"
        actions={
          selectedSite && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> New Page
            </button>
          )
        }
      />

      <div className="mb-6">
        <label className="label mb-2 block">Select Site</label>
        <select className="input max-w-md" value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
          <option value="">Choose a site…</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!selectedSite ? (
        <EmptyState title="Select a site" description="Choose a site above to manage its pages" />
      ) : pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create your first page and start building"
          action={
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> New Page
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="card p-4 flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{page.title}</h3>
                  {page.isHomePage && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Home</span>
                  )}
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {page.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  /{page.slug} · {(page.blocks as PageBlock[]).length} blocks
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-primary btn-sm" onClick={() => setEditingPage(page)}>
                  <Layout className="w-4 h-4" /> Build
                </button>
                <button className="btn-secondary btn-sm" onClick={() => togglePublish(page)}>
                  {page.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  className="btn-ghost btn-sm text-red-500"
                  onClick={async () => {
                    if (confirm(`Delete "${page.title}"? This cannot be undone.`)) {
                      await api.deletePage(page.id);
                      loadPages();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
