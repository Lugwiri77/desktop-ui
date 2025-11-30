'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  User,
  Phone,
  Home,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  type TenantApprovalRequest,
  getTenantApprovalRequest,
  isApprovalPending,
  getTimeRemaining,
} from '@/lib/real-estate-approval-api';
import { Dialog } from '../dialog';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import { NotificationMethodIndicator } from './NotificationMethodIndicator';
import { ManualOverrideActions } from './ManualOverrideActions';
import { ApprovalHistoryTimeline } from './ApprovalHistoryTimeline';
import { format } from 'date-fns';

interface ApprovalDetailsDialogProps {
  approvalId: string | null;
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  onSuccess?: () => void;
}

export function ApprovalDetailsDialog({
  approvalId,
  isOpen,
  onClose,
  staffId,
  onSuccess,
}: ApprovalDetailsDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: ['tenantApprovalRequest', approvalId],
    queryFn: () => getTenantApprovalRequest(approvalId!),
    enabled: isOpen && !!approvalId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Update time remaining every second
  useState(() => {
    if (!request || !isApprovalPending(request)) return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(request.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  });

  const handleSuccess = () => {
    refetch();
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Tenant Approval Details</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Real-time visitor approval status and controls
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        )}

        {/* Content */}
        {!isLoading && request && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Current Status</h3>
                <ApprovalStatusBadge status={request.approvalStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Notification Method</p>
                  <div className="mt-2">
                    <NotificationMethodIndicator
                      method={request.approvalMethod}
                      requiresOtp={request.requiresOtp}
                    />
                  </div>
                </div>

                {isApprovalPending(request) && (
                  <div>
                    <p className="text-sm text-zinc-400">Time Remaining</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-lg font-bold text-yellow-400">
                        {timeRemaining || getTimeRemaining(request.expiresAt)}
                      </span>
                    </div>
                  </div>
                )}

                {request.approvedAt && (
                  <div>
                    <p className="text-sm text-zinc-400">Approved At</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {format(new Date(request.approvedAt), 'PPpp')}
                    </p>
                  </div>
                )}

                {request.rejectedAt && (
                  <div>
                    <p className="text-sm text-zinc-400">Rejected At</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {format(new Date(request.rejectedAt), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Visitor & Tenant Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visitor Info */}
              <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Visitor Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400">Full Name</p>
                    <p className="text-sm font-medium text-white">{request.visitorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Phone Number</p>
                    <p className="text-sm font-medium text-white">{request.visitorPhone}</p>
                  </div>
                  {request.visitorIdNumber && (
                    <div>
                      <p className="text-xs text-zinc-400">ID Number</p>
                      <p className="text-sm font-medium text-white">{request.visitorIdNumber}</p>
                    </div>
                  )}
                  {request.purposeOfVisit && (
                    <div>
                      <p className="text-xs text-zinc-400">Purpose of Visit</p>
                      <p className="text-sm font-medium text-white">{request.purposeOfVisit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenant Info */}
              <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Tenant Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400">Unit Number</p>
                    <p className="text-lg font-bold text-white">{request.unitNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Tenant Name</p>
                    <p className="text-sm font-medium text-white">{request.tenantName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Tenant Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-zinc-400" />
                      <p className="text-sm font-medium text-white">{request.tenantPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval/Rejection Notes */}
            {(request.approvalNotes || request.rejectionReason) && (
              <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
                <h3 className="font-semibold text-white mb-3">
                  {request.approvalNotes ? 'Approval Notes' : 'Rejection Reason'}
                </h3>
                <p className="text-sm text-zinc-300">
                  {request.approvalNotes || request.rejectionReason}
                </p>
              </div>
            )}

            {/* Manual Override Actions */}
            {isApprovalPending(request) && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
                <h3 className="font-semibold text-white mb-4">Security Staff Actions</h3>
                <ManualOverrideActions
                  request={request}
                  onSuccess={handleSuccess}
                  staffId={staffId}
                />
              </div>
            )}

            {/* Approval History Timeline */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <ApprovalHistoryTimeline approvalId={request.id} autoRefresh={true} />
            </div>
          </div>
        )}

        {!isLoading && !request && (
          <div className="text-center py-12">
            <p className="text-zinc-400">Approval request not found</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
