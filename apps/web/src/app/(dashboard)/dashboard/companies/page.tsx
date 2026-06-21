'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import { formatDate } from '@/lib/utils';
import type { Company, CompanyGroup } from '@group-cms/shared';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ groupId: '', name: '', description: '', email: '' });
  const [editing, setEditing] = useState<string | null>(null);

  const load = async () => {
    const [c, g] = await Promise.all([api.getCompanies(), api.getGroups()]);
    setCompanies(c as Company[]);
    setGroups(g as CompanyGroup[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateCompany(editing, form);
      } else {
        await api.createCompany(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ groupId: '', name: '', description: '', email: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      <PageHeader
        title="Companies"
        description="Manage subsidiary companies within your group"
        actions={
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
            <Plus className="w-4 h-4" /> Add Company
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">{editing ? 'Edit Company' : 'New Company'}</h3>
          {!editing && (
            <select className="input" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} required>
              <option value="">Select Group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <input className="input" placeholder="Company Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="input" placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input" placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {companies.length === 0 ? (
        <EmptyState title="No companies yet" description="Add companies to your group"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Company</button>} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: (company.theme as { primaryColor?: string })?.primaryColor || '#2563eb' }}>
                  {company.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost btn-sm" onClick={() => {
                    setEditing(company.id);
                    setForm({ groupId: company.groupId, name: company.name, description: company.description || '', email: company.email || '' });
                    setShowForm(true);
                  }}><Pencil className="w-4 h-4" /></button>
                  <button className="btn-ghost btn-sm text-red-500" onClick={async () => {
                    if (confirm('Delete this company?')) { await api.deleteCompany(company.id); load(); }
                  }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold">{company.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
              <p className="text-xs text-muted-foreground mt-3">{formatDate(company.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
