'use client';

import { useEffect, useState } from 'react';
import { Building2, Globe, FileText, Image, Layers, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, StatCard, LoadingSpinner } from '@/components/layout/sidebar';
import { formatDate } from '@/lib/utils';
import type { DashboardStats } from '@group-cms/shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <LoadingSpinner />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Dashboard"
        description="Overview of your group company websites"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Groups" value={stats?.totalGroups || 0} icon={Layers} color="blue" />
        <StatCard title="Companies" value={stats?.totalCompanies || 0} icon={Building2} color="green" />
        <StatCard title="Sites" value={stats?.totalSites || 0} icon={Globe} color="purple" />
        <StatCard title="Pages" value={stats?.totalPages || 0} icon={FileText} color="orange" />
        <StatCard title="Media" value={stats?.totalMedia || 0} icon={Image} color="pink" />
      </div>

      <div className="card">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {stats?.recentActivity?.length ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium">{activity.entityName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{activity.entityType}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
