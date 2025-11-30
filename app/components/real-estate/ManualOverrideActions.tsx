'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  RefreshCw,
  Phone,
  ShieldCheck,
  ShieldX,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  type TenantApprovalRequest,
  resendApprovalRequest,
  manualOverrideApproval,
} from '@/lib/real-estate-approval-api';
import { Dialog } from '../dialog';

interface ManualOverrideActionsProps {
  request: TenantApprovalRequest;
  onSuccess?: () => void;
  staffId: string;
}

export function ManualOverrideActions({
  request,
  onSuccess,
  staffId
}: ManualOverrideActionsProps) {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'approve' | 'reject'>('approve');
  const [overrideReason, setOverrideReason] = useState('');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Resend mutation
  const resendMutation = useMutation({
    mutationFn: () => resendApprovalRequest({ approvalId: request.id }),
    onSuccess: (data) => {
      setLastResult({
        success: data.success,
        message: data.message,
      });
      setTimeout(() => setLastResult(null), 3000);
      if (data.success && onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      setLastResult({
        success: false,
        message: error.message || 'Failed to resend approval request',
      });
      setTimeout(() => setLastResult(null), 5000);
    },
  });

  // Manual override mutation
  const overrideMutation = useMutation({
    mutationFn: () => manualOverrideApproval({
      approvalId: request.id,
      action: overrideAction,
      reason: overrideReason,
      performedBy: staffId,
    }),
    onSuccess: (data) => {
      setLastResult({
        success: data.success,
        message: data.message,
      });
      setTimeout(() => setLastResult(null), 3000);
      setShowOverrideDialog(false);
      setOverrideReason('');
      if (data.success && onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      setLastResult({
        success: false,
        message: error.message || 'Failed to override approval',
      });
      setTimeout(() => setLastResult(null), 5000);
    },
  });

  const handleResend = () => {
    resendMutation.mutate();
  };

  const handlePhoneCall = () => {
    // Open phone dialer with tenant's number
    if (request.tenantPhone) {
      window.open(`tel:${request.tenantPhone}`, '_self');
    }
  };

  const handleOverride = (action: 'approve' | 'reject') => {
    setOverrideAction(action);
    setShowOverrideDialog(true);
  };

  const handleSubmitOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setLastResult({
        success: false,
        message: 'Please provide a reason for manual override',
      });
      setTimeout(() => setLastResult(null), 3000);
      return;
    }
    overrideMutation.mutate();
  };

  const isLoading = resendMutation.isPending || overrideMutation.isPending;

  return (
    <div className="space-y-3">
      {/* Result Notification */}
      {lastResult && (
        <div
          className={`rounded-lg border p-3 ${
            lastResult.success
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-red-500/50 bg-red-500/10'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.success ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <p
              className={`text-sm ${
                lastResult.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {lastResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleResend}
          disabled={isLoading || request.approvalStatus !== 'pending_approval'}
          className="flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Resend</span>
        </button>

        <button
          onClick={handlePhoneCall}
          disabled={!request.tenantPhone}
          className="flex items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Phone className="h-4 w-4" />
          <span>Call</span>
        </button>

        <button
          onClick={() => handleOverride('approve')}
          disabled={isLoading || request.approvalStatus !== 'pending_approval'}
          className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Override Approve</span>
        </button>

        <button
          onClick={() => handleOverride('reject')}
          disabled={isLoading || request.approvalStatus !== 'pending_approval'}
          className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldX className="h-4 w-4" />
          <span>Override Reject</span>
        </button>
      </div>

      {/* Override Confirmation Dialog */}
      <Dialog open={showOverrideDialog} onClose={() => setShowOverrideDialog(false)}>
        <form onSubmit={handleSubmitOverride} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Manual Override: {overrideAction === 'approve' ? 'Approve' : 'Reject'} Visitor
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              This action will {overrideAction} the visitor entry without tenant confirmation.
              Please provide a detailed reason.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-zinc-400">Visitor:</span>
                <p className="font-medium text-white">{request.visitorName}</p>
              </div>
              <div>
                <span className="text-zinc-400">Unit:</span>
                <p className="font-medium text-white">{request.unitNumber}</p>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-400">Tenant:</span>
                <p className="font-medium text-white">{request.tenantName}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Reason for Manual Override <span className="text-red-400">*</span>
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Emergency situation, tenant unreachable, visitor has valid authorization letter, etc."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={overrideMutation.isPending || !overrideReason.trim()}
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                overrideAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {overrideMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Confirm ${overrideAction === 'approve' ? 'Approve' : 'Reject'}`
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOverrideDialog(false);
                setOverrideReason('');
              }}
              disabled={overrideMutation.isPending}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
