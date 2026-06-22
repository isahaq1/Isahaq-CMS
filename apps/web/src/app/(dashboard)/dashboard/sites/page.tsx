'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Globe, X, CheckCircle, AlertCircle } from 'lucide-react';
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

  // Domain edit modal
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editDomain, setEditDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [domainError, setDomainError] = useState('');

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

  const openDomainEdit = (site: Site) => {
    setEditSite(site);
    setEditDomain(site.domain || '');
    setDomainStatus('idle');
    setDomainError('');
  };

  const saveDomain = async () => {
    if (!editSite) return;
    setSaving(true);
    setDomainStatus('idle');
    setDomainError('');
    try {
      const domain = editDomain.trim().toLowerCase().replace(/^www\./, '') || null;
      await api.updateSite(editSite.id, { domain });
      setDomainStatus('saved');
      load();
      setTimeout(() => setEditSite(null), 1200);
    } catch (err) {
      setDomainStatus('error');
      setDomainError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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
          <input className="input" placeholder="Domain (optional, e.g. mysite.com)" value={form.domain}
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
                  <button className="btn-ghost btn-sm" title="Configure domain" onClick={() => openDomainEdit(site)}>
                    <Globe className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost btn-sm text-red-500" onClick={async () => {
                    if (confirm('Delete this site?')) { await api.deleteSite(site.id); load(); }
                  }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{site.name}</h3>
              <p className="text-sm text-muted-foreground">{(site as Site & { company?: Company }).company?.name}</p>
              {site.domain ? (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" />{site.domain}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No custom domain</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Domain edit modal */}
      {editSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">Custom Domain — {editSite.name}</h2>
              <button onClick={() => setEditSite(null)} className="btn-ghost btn-sm"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <input
                  className="input"
                  placeholder="e.g. mysite.com or shop.mycompany.com"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter without <code>https://</code> or <code>www.</code></p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-blue-800">DNS Setup Instructions</p>
                <p className="text-blue-700">Point your domain to this server by adding these DNS records with your domain registrar:</p>
                <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs space-y-1">
                  <div className="grid grid-cols-3 gap-2 text-gray-500 border-b pb-1 mb-1">
                    <span>Type</span><span>Name</span><span>Value</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-purple-600">A</span>
                    <span>@</span>
                    <span className="text-gray-800">YOUR_SERVER_IP</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-purple-600">CNAME</span>
                    <span>www</span>
                    <span className="text-gray-800">{editDomain || 'yourdomain.com'}</span>
                  </div>
                </div>
                <p className="text-blue-600 text-xs">DNS changes can take up to 48 hours to propagate.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t">
              <div className="flex items-center gap-2 text-sm">
                {domainStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" /> Saved successfully
                  </span>
                )}
                {domainStatus === 'error' && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" /> {domainError}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setEditSite(null)}>Cancel</button>
                <button className="btn-primary" onClick={saveDomain} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Domain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
