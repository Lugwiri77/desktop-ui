'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Phone,
  Mail,
  IdCard,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Users,
  Download,
} from 'lucide-react';
import {
  getPendingStaffNominations,
  approveStaffNomination,
  rejectStaffNomination,
  bulkApproveNominations,
  type SecurityStaffNomination,
  type SecurityRole,
  type GateLocation,
} from '@/lib/security-approval';

export default function StaffApprovalPage() {
  const [selectedNominations, setSelectedNominations] = useState<Set<string>>(new Set());
  const [approvalModal, setApprovalModal] = useState<{
    nomination: SecurityStaffNomination | null;
    isOpen: boolean;
  }>({ nomination: null, isOpen: false });
  const [rejectionModal, setRejectionModal] = useState<{
    nomination: SecurityStaffNomination | null;
    isOpen: boolean;
  }>({ nomination: null, isOpen: false });
  const [bulkApprovalModal, setBulkApprovalModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch pending nominations
  const { data: nominations = [], isLoading } = useQuery({
    queryKey: ['pendingStaffNominations'],
    queryFn: getPendingStaffNominations,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Single approval mutation
  const approveMutation = useMutation({
    mutationFn: approveStaffNomination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingStaffNominations'] });
      setApprovalModal({ nomination: null, isOpen: false });
    },
  });

  // Rejection mutation
  const rejectMutation = useMutation({
    mutationFn: rejectStaffNomination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingStaffNominations'] });
      setRejectionModal({ nomination: null, isOpen: false });
    },
  });

  // Bulk approval mutation
  const bulkApproveMutation = useMutation({
    mutationFn: bulkApproveNominations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingStaffNominations'] });
      setSelectedNominations(new Set());
      setBulkApprovalModal(false);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNominations(new Set(nominations.map(n => n.id)));
    } else {
      setSelectedNominations(new Set());
    }
  };

  const handleSelectNomination = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedNominations);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNominations(newSelected);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Staff Approval</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Review and approve security staff nominations from companies
            </p>
          </div>
          <div className="flex gap-3">
            {selectedNominations.size > 0 && (
              <button
                onClick={() => setBulkApprovalModal(true)}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5" />
                Bulk Approve ({selectedNominations.size})
              </button>
            )}
            <button
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending Approvals</p>
                <p className="mt-2 text-3xl font-bold text-white">{nominations.length}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Selected</p>
                <p className="mt-2 text-3xl font-bold text-white">{selectedNominations.size}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Companies</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {new Set(nominations.map(n => n.securityCompanyId)).size}
                </p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Building2 className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Nominations Table */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
          {nominations.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No pending nominations</p>
              <p className="text-zinc-500 text-xs mt-1">
                All staff nominations have been reviewed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedNominations.size === nominations.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Nominated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {nominations.map((nomination) => (
                    <tr key={nomination.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNominations.has(nomination.id)}
                          onChange={(e) =>
                            handleSelectNomination(nomination.id, e.target.checked)
                          }
                          className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {nomination.firstName} {nomination.lastName}
                          </p>
                          {nomination.proposedBadgeNumber && (
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                              <IdCard className="h-3 w-3" />
                              {nomination.proposedBadgeNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {nomination.phoneNumber}
                          </p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {nomination.proposedWorkEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-zinc-300">
                            {nomination.securityCompanyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(nomination.nominatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setApprovalModal({ nomination, isOpen: true })
                            }
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <UserCheck className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectionModal({ nomination, isOpen: true })
                            }
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <UserX className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.nomination && (
        <ApprovalModal
          nomination={approvalModal.nomination}
          onClose={() => setApprovalModal({ nomination: null, isOpen: false })}
          onApprove={(role, gate, badgeNumber) => {
            approveMutation.mutate({
              nominationId: approvalModal.nomination!.id,
              assignedRole: role,
              assignedGate: gate,
              badgeNumber,
            });
          }}
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Rejection Modal */}
      {rejectionModal.isOpen && rejectionModal.nomination && (
        <RejectionModal
          nomination={rejectionModal.nomination}
          onClose={() => setRejectionModal({ nomination: null, isOpen: false })}
          onReject={(reason) => {
            rejectMutation.mutate({
              nominationId: rejectionModal.nomination!.id,
              rejectionReason: reason,
            });
          }}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

// Approval Modal Component
function ApprovalModal({
  nomination,
  onClose,
  onApprove,
  isLoading,
}: {
  nomination: SecurityStaffNomination;
  onClose: () => void;
  onApprove: (role: SecurityRole, gate: GateLocation, badgeNumber?: string) => void;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<SecurityRole>('security_guard');
  const [selectedGate, setSelectedGate] = useState<GateLocation>('main_gate');
  const [badgeNumber, setBadgeNumber] = useState(nomination.proposedBadgeNumber || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-400" />
            Approve Staff Nomination
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Nomination Details */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Nominee Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-400">Name:</span>
              <span className="text-white ml-2">
                {nomination.firstName} {nomination.lastName}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Phone:</span>
              <span className="text-white ml-2">{nomination.phoneNumber}</span>
            </div>
            <div>
              <span className="text-zinc-400">Email:</span>
              <span className="text-white ml-2">{nomination.proposedWorkEmail}</span>
            </div>
            <div>
              <span className="text-zinc-400">Company:</span>
              <span className="text-white ml-2">{nomination.securityCompanyName}</span>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Assign Role *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as SecurityRole)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="security_guard">Security Guard</option>
              <option value="team_lead">Team Lead</option>
              <option value="security_manager">Security Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Assign Gate *
            </label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value as GateLocation)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="main_gate">Main Gate</option>
              <option value="side_gate">Side Gate</option>
              <option value="back_gate">Back Gate</option>
              <option value="parking_gate">Parking Gate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Badge Number
            </label>
            <input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="Enter badge number..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(selectedRole, selectedGate, badgeNumber || undefined)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Approve & Create Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Rejection Modal Component
function RejectionModal({
  nomination,
  onClose,
  onReject,
  isLoading,
}: {
  nomination: SecurityStaffNomination;
  onClose: () => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            Reject Nomination
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          You are about to reject the nomination for{' '}
          <span className="text-white font-medium">
            {nomination.firstName} {nomination.lastName}
          </span>
          . Please provide a reason for rejection.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(reason)}
            disabled={isLoading || !reason.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Confirm Rejection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
