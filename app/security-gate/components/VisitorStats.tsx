'use client';

import { useEffect, useState } from 'react';
import { Users, UserX, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { SecurityGateStats } from '@/lib/security-gate';

interface VisitorStatsProps {
  stats?: SecurityGateStats[];
}

export default function VisitorStats({ stats }: VisitorStatsProps) {
  const [chartData, setChartData] = useState<number[]>([]);

  // Aggregate stats from all gates
  const aggregatedStats = stats?.reduce((acc, gateStats) => ({
    currentVisitorsInside: acc.currentVisitorsInside + gateStats.currentVisitorsInside,
    totalEntriesToday: acc.totalEntriesToday + gateStats.totalEntriesToday,
    totalExitsToday: acc.totalExitsToday + gateStats.totalExitsToday,
  }), {
    currentVisitorsInside: 0,
    totalEntriesToday: 0,
    totalExitsToday: 0,
  });

  // Track entries over time for chart
  useEffect(() => {
    if (aggregatedStats) {
      setChartData(prev => {
        const newData = [...prev, aggregatedStats.currentVisitorsInside];
        // Keep only last 20 data points
        return newData.slice(-20);
      });
    }
  }, [aggregatedStats?.currentVisitorsInside]);

  if (!stats || stats.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded" />
          <div className="h-16 bg-white/5 rounded" />
          <div className="h-16 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  const maxChartValue = Math.max(...chartData, 10);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Visitor Statistics
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Currently Inside */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Currently Inside</p>
                <p className="text-2xl font-bold text-white">{aggregatedStats?.currentVisitorsInside || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visitors Inside Over Time Chart */}
        {chartData.length > 1 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="text-xs font-medium text-zinc-400 mb-3">Visitors Trend</h4>
            <div className="h-12 flex items-end gap-0.5">
              {chartData.map((value, index) => {
                const height = (value / maxChartValue) * 100;
                const isLast = index === chartData.length - 1;
                return (
                  <div
                    key={index}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${height}%`,
                      backgroundColor: isLast
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'rgba(59, 130, 246, 0.2)',
                      minHeight: '4px',
                    }}
                    title={`${value} visitors`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Summary */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="text-xs font-medium text-zinc-400 mb-3">Today's Activity</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xs text-zinc-400 mb-1">Entries</p>
              <p className="text-xl font-bold text-green-400">{aggregatedStats?.totalEntriesToday || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400 mb-1">Exits</p>
              <p className="text-xl font-bold text-zinc-400">{aggregatedStats?.totalExitsToday || 0}</p>
            </div>
          </div>
        </div>

        {/* Gates Status */}
        {stats && stats.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="text-xs font-medium text-zinc-400 mb-3">Active Gates</h4>
            <div className="space-y-2">
              {stats.map((gateStat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{gateStat.gateLocation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <span className="text-zinc-400">{gateStat.currentVisitorsInside} inside</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Auto-refreshing every 5s</span>
        </div>
      </div>
    </div>
  );
}
