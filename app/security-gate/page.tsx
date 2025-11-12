'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  QrCode,
  Search,
  UserCheck,
  UserX,
  Users,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';
import QRScanner from './components/QRScanner';
import ManualEntry from './components/ManualEntry';
import RecentActivity from './components/RecentActivity';
import QuickSearch from './components/QuickSearch';
import ReportIncidentModal from './components/ReportIncidentModal';
import { getSecurityGateStats } from '@/lib/security-gate';

export default function SecurityGatePage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [showSearch, setShowSearch] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Fetch gate statistics
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['securityGateStats'],
    queryFn: getSecurityGateStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  });


  const handleScanSuccess = () => {
    // Refetch stats after successful scan
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Inside Now"
            value={stats?.currentlyInside || 0}
            color="blue"
          />
          <StatCard
            icon={UserCheck}
            label="Checked In Today"
            value={stats?.checkedInToday || 0}
            color="green"
          />
          <StatCard
            icon={UserX}
            label="Checked Out Today"
            value={stats?.checkedOutToday || 0}
            color="zinc"
          />
          <StatCard
            icon={Clock}
            label="Avg. Duration"
            value={stats?.avgDuration ? `${stats.avgDuration} min` : '--'}
            color="purple"
            isText
          />
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* QR Scanner / Activity Feed */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-white/10 flex">
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'scan'
                      ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <QrCode className="h-5 w-5" />
                    <span>QR Scanner</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'manual'
                      ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    <span>Manual Entry</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'scan' && (
                  <QRScanner onScanSuccess={handleScanSuccess} />
                )}
                {activeTab === 'manual' && (
                  <ManualEntry onEntrySuccess={handleScanSuccess} />
                )}
              </div>
            </div>
          </div>

          {/* Side Panel: Quick Actions & Stats */}
          <div className="space-y-4">
            {/* Quick Search */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Quick Search</h3>
                {showSearch && (
                  <button
                    onClick={() => setShowSearch(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!showSearch ? (
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Search for Visitor</span>
                </button>
              ) : (
                <QuickSearch onClose={() => setShowSearch(false)} />
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
              <h3 className="text-sm font-medium text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between">
                  <span>View Shift Handover</span>
                  <ArrowRightLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Report Incident</span>
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Recent Activity Panel (always visible, scrollable) */}
            <RecentActivity />
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      <ReportIncidentModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSuccess={() => {
          refetchStats();
        }}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isText = false,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'zinc' | 'purple';
  isText?: boolean;
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-400">{label}</p>
          <p className={`mt-2 ${isText ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
            {value}
          </p>
        </div>
        <div className={`rounded-xl ${colorClasses[color]} p-3`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
