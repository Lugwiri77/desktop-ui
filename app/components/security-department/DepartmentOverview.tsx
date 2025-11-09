'use client';

import { Users, UserCheck, Eye, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSecurityDepartmentOverview } from '@/hooks/use-security-department';

export function DepartmentOverview() {
  const { data: overview, isLoading } = useSecurityDepartmentOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 p-6 animate-pulse">
            <div className="h-12 w-12 bg-zinc-800 rounded-lg mb-4" />
            <div className="h-4 bg-zinc-800 rounded w-24 mb-2" />
            <div className="h-8 bg-zinc-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-300">Failed to load department overview</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Internal Staff',
      value: overview.internalStaffCount,
      icon: Users,
      color: 'blue',
      trend: overview.trends.staffChange,
    },
    {
      label: 'External Contractors',
      value: overview.externalStaffCount,
      icon: UserCheck,
      color: 'green',
      trend: overview.trends.staffChange,
    },
    {
      label: 'Visitors Today',
      value: overview.visitorsToday,
      icon: Eye,
      color: 'purple',
      trend: overview.trends.visitorsChange,
    },
    {
      label: 'Active Incidents',
      value: overview.activeIncidents,
      icon: AlertTriangle,
      color: overview.activeIncidents > 0 ? 'red' : 'zinc',
      trend: overview.trends.incidentsChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number;
}

function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/10 border-green-500/50 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/50 text-purple-400',
    red: 'bg-red-500/10 border-red-500/50 text-red-400',
    zinc: 'bg-zinc-500/10 border-zinc-500/50 text-zinc-400',
  }[color];

  const showTrend = trend !== undefined && trend !== 0;
  const isPositive = trend && trend > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 hover:bg-zinc-900/80 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg border ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
        {showTrend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-zinc-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
