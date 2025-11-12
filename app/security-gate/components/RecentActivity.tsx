'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowDownToLine, ArrowUpFromLine, User } from 'lucide-react';
import { graphql } from '@/lib/graphql';

// Types
interface VisitorActivity {
  id: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  gateLocation: string;
  entryTime: string;
  exitTime?: string;
  hostName?: string;
}

interface RecentActivityProps {
  gateLocation?: string;
  limit?: number;
}

// API function
async function fetchRecentActivity(gateLocation?: string, limit?: number) {
  const query = `
    query RecentVisitorActivity($gateLocation: GateLocation, $limit: Int) {
      recentVisitorActivity(gateLocation: $gateLocation, limit: $limit) {
        id
        visitorName
        visitorPhone
        purpose
        gateLocation
        entryTime
        exitTime
        hostName
      }
    }
  `;

  const data = await graphql<{ recentVisitorActivity: VisitorActivity[] }>(
    query,
    { gateLocation, limit }
  );
  return data.recentVisitorActivity;
}

export default function RecentActivity({ gateLocation, limit = 20 }: RecentActivityProps) {
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ['recentActivity', gateLocation, limit],
    queryFn: () => fetchRecentActivity(gateLocation, limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return '****' + phone.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="h-4 w-3/4 rounded bg-white/10 mb-2" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load activity'}
          </p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-red-300 underline hover:text-red-200">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <button onClick={() => refetch()} className="text-sm text-zinc-400 hover:text-white transition-colors">
          Refresh
        </button>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {!activities || activities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400">No recent activity</p>
            <p className="text-sm text-zinc-500 mt-1">Visitor entries and exits will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activities.map((activity) => {
              const isCheckOut = !!activity.exitTime;
              return (
                <div key={activity.id} className="p-4 transition-colors hover:bg-white/5">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${isCheckOut ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                      {isCheckOut ? (
                        <ArrowUpFromLine className="h-4 w-4 text-blue-400" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{activity.visitorName}</p>
                          <p className="text-sm text-zinc-400">{maskPhone(activity.visitorPhone)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-white">
                            {formatTime(isCheckOut ? activity.exitTime! : activity.entryTime)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(isCheckOut ? activity.exitTime! : activity.entryTime)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-1 ${isCheckOut ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                          {isCheckOut ? 'Check-out' : 'Check-in'}
                        </span>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-zinc-400">
                          {activity.gateLocation.replace('_', ' ')}
                        </span>
                        {activity.purpose && <span className="truncate text-zinc-500">{activity.purpose}</span>}
                      </div>
                      {activity.hostName && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                          <User className="h-3 w-3" />
                          <span>Host: {activity.hostName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
