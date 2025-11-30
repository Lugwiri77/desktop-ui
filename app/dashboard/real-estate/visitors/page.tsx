'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  type TenantApprovalRequest,
  type ApprovalStatus,
  getTenantApprovalRequests,
  isApprovalPending,
  getTimeRemaining,
} from '@/lib/real-estate-approval-api';
import { ApprovalStatusBadge } from '@/app/components/real-estate/ApprovalStatusBadge';
import { NotificationMethodIndicator } from '@/app/components/real-estate/NotificationMethodIndicator';
import { ApprovalDetailsDialog } from '@/app/components/real-estate/ApprovalDetailsDialog';
import { format } from 'date-fns';

export default function RealEstateVisitorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | ''>('');
  const [filterUnit, setFilterUnit] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch approval requests with auto-refresh every 5 seconds
  const { data: allRequests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['tenantApprovalRequests', filterStatus, startDate, filterUnit],
    queryFn: () => getTenantApprovalRequests({
      status: filterStatus || undefined,
      startDate,
      unitNumber: filterUnit || undefined,
    }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Filter by search query (client-side)
  const filteredRequests = allRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.visitorName.toLowerCase().includes(query) ||
      request.visitorPhone.includes(query) ||
      request.unitNumber.toLowerCase().includes(query) ||
      request.tenantName.toLowerCase().includes(query) ||
      (request.visitorIdNumber && request.visitorIdNumber.toLowerCase().includes(query))
    );
  });

  const handleViewDetails = (approvalId: string) => {
    setSelectedApprovalId(approvalId);
    setShowDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsDialog(false);
    setSelectedApprovalId(null);
  };

  const handleSuccess = () => {
    refetch();
  };

  // Calculate stats
  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((r) => r.approvalStatus === 'pending_approval').length,
    approved: filteredRequests.filter((r) => r.approvalStatus === 'approved').length,
    rejected: filteredRequests.filter((r) => r.approvalStatus === 'rejected').length,
    expired: filteredRequests.filter((r) => r.approvalStatus === 'expired').length,
  };

  // Get staff ID from localStorage (or context/auth)
  const staffId = typeof window !== 'undefined' ? localStorage.getItem('staffId') || '' : '';

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-400" />
              Real Estate Visitor Approvals
              {isFetching && (
                <span className="text-sm font-normal text-blue-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Automated tenant approval system • Real-time updates every 5 seconds
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Clock}
            label="Total Today"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Waiting"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={CheckCircle}
            label="Approved"
            value={stats.approved}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
          <StatCard
            icon={AlertTriangle}
            label="Expired"
            value={stats.expired}
            color="orange"
          />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitors, units, tenants..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | '')}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending_approval">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="text"
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              placeholder="Filter by unit..."
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Approval Requests Table */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Visitor
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Unit / Tenant
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Method
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Time
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading approval requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No approval requests found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{request.visitorName}</p>
                          <p className="text-xs text-zinc-400">{request.visitorPhone}</p>
                          {request.purposeOfVisit && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {request.purposeOfVisit}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-blue-400">{request.unitNumber}</p>
                          <p className="text-sm text-white">{request.tenantName}</p>
                          <p className="text-xs text-zinc-400">{request.tenantPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <NotificationMethodIndicator
                          method={request.approvalMethod}
                          requiresOtp={request.requiresOtp}
                          variant="icon-only"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-white">
                            {format(new Date(request.requestedAt), 'HH:mm:ss')}
                          </p>
                          {isApprovalPending(request) && (
                            <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeRemaining(request.expiresAt)}
                            </p>
                          )}
                          {request.approvedAt && (
                            <p className="text-xs text-green-400 mt-1">
                              Approved: {format(new Date(request.approvedAt), 'HH:mm')}
                            </p>
                          )}
                          {request.rejectedAt && (
                            <p className="text-xs text-red-400 mt-1">
                              Rejected: {format(new Date(request.rejectedAt), 'HH:mm')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ApprovalStatusBadge status={request.approvalStatus} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(request.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approval Details Dialog */}
      <ApprovalDetailsDialog
        approvalId={selectedApprovalId}
        isOpen={showDetailsDialog}
        onClose={handleCloseDetails}
        staffId={staffId}
        onSuccess={handleSuccess}
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
}: {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'orange';
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-xl border ${colorClasses[color]} p-3`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
