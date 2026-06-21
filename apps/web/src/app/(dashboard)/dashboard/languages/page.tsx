'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner, EmptyState } from '@/components/layout/sidebar';
import type { Language } from '@group-cms/shared';

const BLANK = { code: '', name: '', nativeName: '', isRTL: false };

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await api.getLanguages();
    setLanguages(data as Language[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLanguage(form);
      setShowForm(false);
      setForm(BLANK);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add language');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (lang: Language) => {
    await api.updateLanguage(lang.id, { isActive: !lang.isActive });
    load();
  };

  const handleSetDefault = async (lang: Language) => {
    await api.setDefaultLanguage(lang.id);
    load();
  };

  const handleDelete = async (lang: Language) => {
    if (!confirm(`Delete "${lang.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteLanguage(lang.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete language');
    }
  };

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  return (
    <DashboardShell>
      <PageHeader
        title="Languages"
        description="Manage site languages for multilingual content"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Language
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">New Language</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="label">Code <span className="text-muted-foreground text-xs">(e.g. bn, ar, fr)</span></label>
              <input
                className="input"
                placeholder="en"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
                required
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <label className="label">Name <span className="text-muted-foreground text-xs">(in English)</span></label>
              <input
                className="input"
                placeholder="Bengali"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label">Native Name</label>
              <input
                className="input"
                placeholder="বাংলা"
                value={form.nativeName}
                onChange={(e) => setForm({ ...form, nativeName: e.target.value })}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={form.isRTL}
              onChange={(e) => setForm({ ...form, isRTL: e.target.checked })}
            />
            <span className="text-sm">Right-to-left (RTL) language</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Language'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(BLANK); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {languages.length === 0 ? (
        <EmptyState
          title="No languages"
          description="Add languages to enable multilingual content on your sites"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Language</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Language</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Native Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">RTL</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {languages.map((lang) => (
                <tr key={lang.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{lang.name}</span>
                      {lang.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{lang.code}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lang.nativeName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lang.isRTL ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {lang.isRTL ? 'RTL' : 'LTR'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(lang)}
                      disabled={lang.isDefault}
                      className={`text-xs px-2 py-0.5 rounded-full transition ${
                        lang.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {lang.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!lang.isDefault && (
                        <button
                          onClick={() => handleSetDefault(lang)}
                          className="btn-ghost btn-sm text-xs"
                          title="Set as default"
                        >
                          Set Default
                        </button>
                      )}
                      {!lang.isDefault && (
                        <button
                          onClick={() => handleDelete(lang)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
