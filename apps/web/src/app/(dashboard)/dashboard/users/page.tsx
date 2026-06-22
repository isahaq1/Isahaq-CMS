'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound, X } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import { formatDate } from '@/lib/utils';
import type { User, UserRole } from '@group-cms/shared';

const ROLES: UserRole[] = ['SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'];

const roleBadge: Record<UserRole, string> = {
  SUPER_ADMIN:   'bg-purple-100 text-purple-700',
  GROUP_ADMIN:   'bg-blue-100 text-blue-700',
  COMPANY_ADMIN: 'bg-green-100 text-green-700',
  EDITOR:        'bg-gray-100 text-gray-600',
};

const roleLabel: Record<UserRole, string> = {
  SUPER_ADMIN:   'Super Admin',
  GROUP_ADMIN:   'Group Admin',
  COMPANY_ADMIN: 'Company Admin',
  EDITOR:        'Editor',
};

type FormMode = 'add' | 'edit' | null;

const emptyForm = { name: '', email: '', password: '', role: 'EDITOR' as UserRole };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pwdUserId, setPwdUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setMode('add');
  };

  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingId(u.id);
    setError('');
    setMode('edit');
  };

  const closeForm = () => { setMode(null); setEditingId(null); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'edit' && editingId) {
        const { password: _, ...data } = form;
        await api.updateUser(editingId, data);
      } else {
        await api.createUser(form);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdUserId) return;
    setSaving(true);
    setError('');
    try {
      await api.changeUserPassword(pwdUserId, newPassword);
      setPwdUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      <PageHeader
        title="Users"
        description="Manage team members and their roles"
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      {/* Add / Edit form */}
      {mode && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{mode === 'edit' ? 'Edit User' : 'New User'}</h3>
            <button type="button" onClick={closeForm} className="btn-ghost btn-sm p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="input" placeholder="Full name" required minLength={2}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input className="input" type="email" placeholder="user@example.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {mode === 'add' && (
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" required minLength={6}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{roleLabel[r]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Update' : 'Create User'}
            </button>
            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      {/* Change password modal */}
      {pwdUserId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handlePasswordChange} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Change Password</h3>
              <button type="button" className="btn-ghost btn-sm p-1" onClick={() => { setPwdUserId(null); setNewPassword(''); setError(''); }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <input className="input w-full" type="password" placeholder="New password (min. 6 chars)"
              required minLength={6} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Update Password'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setPwdUserId(null); setNewPassword(''); setError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      {users.length === 0 ? (
        <EmptyState title="No users yet" description="Add your first team member to get started"
          action={<button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add User</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost btn-sm" title="Change password"
                        onClick={() => { setPwdUserId(u.id); setError(''); }}>
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost btn-sm" title="Edit user" onClick={() => openEdit(u)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost btn-sm text-red-500 hover:text-red-600" title="Delete user"
                        onClick={() => handleDelete(u)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
