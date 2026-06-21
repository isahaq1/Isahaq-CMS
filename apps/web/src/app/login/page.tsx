'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@group-cms/shared';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('admin@groupcms.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setAuth(data.user as User, data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Group CMS</h1>
          <p className="text-muted-foreground mt-2">Manage your company group websites</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Demo: admin@groupcms.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
