'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  User,
  Phone,
  Building,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { graphql } from '@/lib/graphql';

// Types
interface Visitor {
  id: string;
  visitorFullName: string;
  visitorPhoneNumber: string;
  visitorEmail?: string;
  visitorOrganization?: string;
  visitorType: string;
  purpose?: string;
  status: string;
  entryTime: string;
  actualExitTime?: string;
  destinationOfficeLocation?: string;
  servingStaffName?: string;
  entryGate?: string;
  exitGate?: string;
}

type TabType = 'inside' | 'checked-in' | 'checked-out';

// API functions
async function fetchActiveVisitors() {
  const query = `
    query GetActiveVisitors {
      activeVisitors {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorOrganization
        visitorType
        purposeOfVisit
        status
        entryTime
        actualExitTime
        destinationOfficeLocation
        entryGate
        exitGate
      }
    }
  `;

  const data = await graphql<{ activeVisitors: Visitor[] }>(query);
  return data.activeVisitors;
}

export default function VisitorTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('inside');

  // Fetch all active visitors (not checked out)
  const { data: visitors, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['activeVisitors'],
    queryFn: fetchActiveVisitors,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today at ${formatTime(dateString)}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeDuration = (entryTime: string) => {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  // Filter visitors based on active tab
  const getFilteredVisitors = () => {
    if (!visitors) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'inside':
        // Currently inside (checked in but not checked out)
        return visitors.filter(v => !v.actualExitTime);

      case 'checked-in':
        // Checked in today (includes those inside and those who already left)
        return visitors.filter(v => {
          const entryDate = new Date(v.entryTime);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        });

      case 'checked-out':
        // Checked out today
        return visitors.filter(v => {
          if (!v.actualExitTime) return false;
          const exitDate = new Date(v.actualExitTime);
          exitDate.setHours(0, 0, 0, 0);
          return exitDate.getTime() === today.getTime();
        });

      default:
        return visitors;
    }
  };

  const filteredVisitors = getFilteredVisitors();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      checked_in: { color: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Checked In' },
      pending_routing: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      routed: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Routed' },
      in_service: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'In Service' },
      completed: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', label: 'Completed' },
      checked_out: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', label: 'Checked Out' },
    };

    const config = statusConfig[status] || { color: 'bg-white/10 text-white border-white/30', label: status };

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getVisitorTypeIcon = (type: string) => {
    switch (type) {
      case 'business_staff':
        return <Building className="h-4 w-4" />;
      case 'institution_staff':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'inside' as TabType, label: 'Inside Now', icon: Users, count: visitors?.filter(v => !v.actualExitTime).length || 0 },
    { id: 'checked-in' as TabType, label: 'Checked In Today', icon: UserCheck, count: 0 },
    { id: 'checked-out' as TabType, label: 'Checked Out Today', icon: UserX, count: 0 },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900">
      {/* Tabs Header */}
      <div className="border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-white">Visitor Management</h2>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-400 bg-blue-500/10 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'inside' && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? 'bg-blue-400 text-zinc-900' : 'bg-white/10 text-zinc-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-white/5 bg-white/5 p-4">
                <div className="mb-2 h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400">No visitors found</p>
            <p className="mt-1 text-sm text-zinc-500">
              {activeTab === 'inside' && 'No visitors currently inside'}
              {activeTab === 'checked-in' && 'No check-ins today'}
              {activeTab === 'checked-out' && 'No check-outs today'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredVisitors.map((visitor) => (
              <div
                key={visitor.id}
                className="p-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Visitor Name & Status */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{visitor.visitorFullName}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {getStatusBadge(visitor.status)}
                          {activeTab === 'inside' && (
                            <span className="text-xs text-zinc-500">
                              <Clock className="mr-1 inline h-3 w-3" />
                              {getTimeDuration(visitor.entryTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{visitor.visitorPhoneNumber}</span>
                      </div>
                      {visitor.visitorOrganization && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          <span>{visitor.visitorOrganization}</span>
                        </div>
                      )}
                    </div>

                    {/* Purpose & Location */}
                    {visitor.purpose && (
                      <p className="mb-2 text-sm text-zinc-500">
                        <span className="font-medium text-zinc-400">Purpose:</span> {visitor.purpose}
                      </p>
                    )}

                    {visitor.destinationOfficeLocation && (
                      <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{visitor.destinationOfficeLocation}</span>
                      </div>
                    )}

                    {/* Timing Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <div>
                        <span className="text-zinc-600">Entry:</span> {formatTime(visitor.entryTime)}
                        {visitor.entryGate && (
                          <span className="ml-1.5 rounded bg-white/5 px-1.5 py-0.5">
                            {visitor.entryGate.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {visitor.actualExitTime && (
                        <div>
                          <span className="text-zinc-600">Exit:</span> {formatTime(visitor.actualExitTime)}
                          {visitor.exitGate && (
                            <span className="ml-1.5 rounded bg-white/5 px-1.5 py-0.5">
                              {visitor.exitGate.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="flex-shrink-0 rounded-lg bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {filteredVisitors.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 text-center text-sm text-zinc-400">
          Showing {filteredVisitors.length} {filteredVisitors.length === 1 ? 'visitor' : 'visitors'}
        </div>
      )}
    </div>
  );
}
