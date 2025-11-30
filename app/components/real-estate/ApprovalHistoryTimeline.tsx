'use client';

import { useQuery } from '@tanstack/react-query';
import {
  type TenantApprovalHistory,
  getApprovalHistory,
} from '@/lib/real-estate-approval-api';
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ApprovalHistoryTimelineProps {
  approvalId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ApprovalHistoryTimeline({
  approvalId,
  autoRefresh = true,
  refreshInterval = 5000,
}: ApprovalHistoryTimelineProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['approvalHistory', approvalId],
    queryFn: () => getApprovalHistory(approvalId),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const getActionIcon = (action: TenantApprovalHistory['action']) => {
    const iconClass = 'h-5 w-5';
    switch (action) {
      case 'requested':
        return <Send className={iconClass} />;
      case 'approved':
        return <CheckCircle className={iconClass} />;
      case 'rejected':
        return <XCircle className={iconClass} />;
      case 'expired':
        return <AlertTriangle className={iconClass} />;
      case 'resent':
        return <RefreshCw className={iconClass} />;
      case 'called':
        return <Phone className={iconClass} />;
      case 'overridden':
        return <ShieldAlert className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getActionColor = (action: TenantApprovalHistory['action']) => {
    switch (action) {
      case 'requested':
      case 'resent':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'expired':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'called':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'overridden':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
  };

  const getActionText = (action: TenantApprovalHistory['action']) => {
    switch (action) {
      case 'requested':
        return 'Approval Requested';
      case 'approved':
        return 'Visitor Approved';
      case 'rejected':
        return 'Visitor Rejected';
      case 'expired':
        return 'Request Expired';
      case 'resent':
        return 'Approval Resent';
      case 'called':
        return 'Tenant Called';
      case 'overridden':
        return 'Manual Override';
      default:
        return action;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">No history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Approval History</h3>
        <span className="text-xs text-zinc-400">
          {history.length} {history.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Timeline Items */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

        {/* Timeline Events */}
        <div className="space-y-4">
          {history.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${getActionColor(
                  event.action
                )}`}
              >
                {getActionIcon(event.action)}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">
                        {getActionText(event.action)}
                      </h4>
                      {event.notes && (
                        <p className="mt-1 text-sm text-zinc-400">{event.notes}</p>
                      )}
                      {event.method && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Method: {event.method.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>

                  {event.performedBy && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <span>By:</span>
                      <span className="font-medium text-zinc-400">
                        {event.performedBy}
                      </span>
                      {event.performedByRole && (
                        <span className="rounded bg-white/5 px-2 py-0.5">
                          {event.performedByRole}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
