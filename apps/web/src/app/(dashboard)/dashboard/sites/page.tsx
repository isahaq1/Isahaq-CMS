'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import type { Site, Company } from '@group-cms/shared';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyId: '', name: '', domain: '' });

  const load = async () => {
    const [s, c] = await Promise.all([api.getSites(), api.getCompanies()]);
    setSites(s as Site[]);
    setCompanies(c as Company[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSite(form);
      setShowForm(false);
      setForm({ companyId: '', name: '', domain: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      <PageHeader
        title="Sites"
        description="Manage company websites"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Site
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">New Site</h3>
          <select className="input" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} required>
            <option value="">Select Company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="Site Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Domain (optional)" value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {sites.length === 0 ? (
        <EmptyState title="No sites yet" description="Create a website for your company"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Site</button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${site.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {site.isPublished ? 'Published' : 'Draft'}
                </span>
                <div className="flex gap-1">
                  <Link href={`/preview/${site.id}`} className="btn-ghost btn-sm" target="_blank">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button className="btn-ghost btn-sm text-red-500" onClick={async () => {
                    if (confirm('Delete this site?')) { await api.deleteSite(site.id); load(); }
                  }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{site.name}</h3>
              <p className="text-sm text-muted-foreground">{(site as Site & { company?: Company }).company?.name}</p>
              {site.domain && <p className="text-xs text-muted-foreground mt-1">{site.domain}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
