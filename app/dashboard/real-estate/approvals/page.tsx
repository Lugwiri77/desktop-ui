'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
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
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { toast } from 'sonner';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';

export default function ApprovalsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | ''>('');
  const [filterUnit, setFilterUnit] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info || !info.realEstateBusinessSubcategory) {
      router.push('/dashboard');
      return;
    }

    // All real estate staff can access (Security, Security Manager, Administrator)
    const canAccess = isAdministrator(info.userRole) ||
                      info.staffRole === 'Security' ||
                      info.department === 'Security' ||
                      info.staffRole === 'SecurityManager';

    if (!canAccess) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  // Fetch approval requests with auto-refresh every 5 seconds
  const { data: allRequests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['tenantApprovalRequests', filterStatus, startDate, filterUnit],
    queryFn: () => getTenantApprovalRequests({
      status: filterStatus || undefined,
      startDate,
      unitNumber: filterUnit || undefined,
    }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    enabled: !!userInfo,
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
    toast.success('Action completed successfully');
  };

  // Calculate stats
  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((r) => r.approvalStatus === 'pending_approval').length,
    approved: filteredRequests.filter((r) => r.approvalStatus === 'approved').length,
    rejected: filteredRequests.filter((r) => r.approvalStatus === 'rejected').length,
    expired: filteredRequests.filter((r) => r.approvalStatus === 'expired').length,
  };

  if (loading || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Determine user capabilities
  const isSecurityManager = userInfo.staffRole === 'SecurityManager';
  const isAdmin = isAdministrator(userInfo.userRole);
  const canManualOverride = isSecurityManager || isAdmin;

  // Get staff ID from userInfo
  const staffId = userInfo.personalAccountId || '';

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => {
        localStorage.clear();
        router.push('/login');
      }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdmin}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Visitor Approvals
              {isFetching && (
                <span className="text-sm font-normal text-blue-600">Updating...</span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {canManualOverride
                ? 'Monitor visitor approvals and perform manual overrides when needed'
                : 'Monitor visitor approval requests in real-time'}
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            outline
          >
            Refresh
          </Button>
        </div>

        {/* Role-Based Access Notice */}
        {!canManualOverride && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <p className="text-sm text-blue-900">
              <strong>Security Staff:</strong> You can view approval requests. Only tenants can approve/reject visitors via OTP.
              For emergency overrides, contact your Security Manager.
            </p>
          </div>
        )}

        {canManualOverride && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <p className="text-sm text-amber-900">
              <strong>Manual Override Access:</strong> You can manually approve or reject visitors in emergency situations.
              This bypasses the tenant OTP requirement. Use this power responsibly.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={ClockIcon}
            label="Total Today"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={ClockIcon}
            label="Pending"
            value={stats.pending}
            color="amber"
          />
          <StatCard
            icon={CheckCircleIcon}
            label="Approved"
            value={stats.approved}
            color="lime"
          />
          <StatCard
            icon={XCircleIcon}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
          <StatCard
            icon={ExclamationTriangleIcon}
            label="Expired"
            value={stats.expired}
            color="zinc"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visitors, units, tenants..."
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | '')}
            >
              <option value="">All Status</option>
              <option value="pending_approval">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Input
              type="text"
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              placeholder="Filter by unit..."
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* Approval Requests Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading approval requests...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No approval requests</h3>
              <p className="text-gray-500">
                {filterStatus ? 'No matching requests for the selected filters' : 'No approval requests found for today'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Visitor</TableHeader>
                  <TableHeader>Unit / Tenant</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Time</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{request.visitorName}</div>
                        <div className="text-sm text-gray-500">{request.visitorPhone}</div>
                        {request.purposeOfVisit && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {request.purposeOfVisit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-blue-600">{request.unitNumber}</div>
                        <div className="text-sm text-gray-900">{request.tenantName}</div>
                        <div className="text-xs text-gray-500">{request.tenantPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <NotificationMethodIndicator
                        method={request.approvalMethod}
                        requiresOtp={request.requiresOtp}
                        variant="icon-only"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(request.requestedAt).toLocaleTimeString()}
                        </div>
                        {isApprovalPending(request) && (
                          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {getTimeRemaining(request.expiresAt)}
                          </div>
                        )}
                        {request.approvedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Approved: {new Date(request.approvedAt).toLocaleTimeString()}
                          </div>
                        )}
                        {request.rejectedAt && (
                          <div className="text-xs text-red-600 mt-1">
                            Rejected: {new Date(request.rejectedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ApprovalStatusBadge status={request.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewDetails(request.id)}
                        outline
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
    </ApplicationLayout>
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
  color: 'blue' | 'amber' | 'lime' | 'red' | 'zinc';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    lime: 'bg-lime-50 border-lime-200 text-lime-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    zinc: 'bg-zinc-50 border-zinc-200 text-zinc-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl border p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
