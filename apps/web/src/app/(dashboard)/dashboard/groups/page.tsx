'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import { formatDate } from '@/lib/utils';
import type { CompanyGroup } from '@group-cms/shared';

export default function GroupsPage() {
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState<string | null>(null);

  const load = () => {
    api.getGroups().then(setGroups).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateGroup(editing, form);
      } else {
        await api.createGroup(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group and all its companies?')) return;
    await api.deleteGroup(id);
    load();
  };

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      <PageHeader
        title="Company Groups"
        description="Manage your corporate group hierarchy"
        actions={
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
            <Plus className="w-4 h-4" /> Add Group
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">{editing ? 'Edit Group' : 'New Group'}</h3>
          <input className="input" placeholder="Group Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="input" placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <EmptyState title="No groups yet" description="Create your first company group to get started"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Group</button>} />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.id} className="card p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Created {formatDate(group.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm" onClick={() => {
                  setEditing(group.id);
                  setForm({ name: group.name, description: group.description || '' });
                  setShowForm(true);
                }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="btn-ghost btn-sm text-red-500" onClick={() => handleDelete(group.id)}>
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
