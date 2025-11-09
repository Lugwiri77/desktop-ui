'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Search,
  Filter,
  Edit,
  UserX,
  Eye,
  Clock,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  getSecurityStaff,
  getPendingStaffNominations,
  updateSecurityStaff,
  deactivateSecurityStaff,
  type SecurityStaff,
  type SecurityRole,
  type GateLocation,
} from '@/lib/security-approval';
import Link from 'next/link';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';
type RoleFilter = 'all' | SecurityRole;
type GateFilter = 'all' | GateLocation;

export default function SecurityStaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [gateFilter, setGateFilter] = useState<GateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editModal, setEditModal] = useState<{
    staff: SecurityStaff | null;
    isOpen: boolean;
  }>({ staff: null, isOpen: false });

  const queryClient = useQueryClient();

  // Fetch security staff
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['securityStaff', roleFilter, gateFilter, statusFilter],
    queryFn: () =>
      getSecurityStaff({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        gate: gateFilter !== 'all' ? gateFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Fetch pending nominations count
  const { data: pendingNominations = [] } = useQuery({
    queryKey: ['pendingStaffNominations'],
    queryFn: getPendingStaffNominations,
  });

  // Update staff mutation
  const updateMutation = useMutation({
    mutationFn: updateSecurityStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityStaff'] });
      setEditModal({ staff: null, isOpen: false });
    },
  });

  // Deactivate staff mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateSecurityStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityStaff'] });
    },
  });

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query) ||
        s.badgeNumber.toLowerCase().includes(query) ||
        s.workEmail.toLowerCase().includes(query)
    );
  }, [staff, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter((s) => s.status === 'active').length,
      inactive: staff.filter((s) => s.status === 'inactive').length,
      pending: pendingNominations.length,
    };
  }, [staff, pendingNominations]);

  const getRoleBadgeColor = (role: SecurityRole) => {
    switch (role) {
      case 'security_manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/50';
      case 'team_lead':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/50';
      case 'security_guard':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'inactive':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
    }
  };

  const formatRole = (role: SecurityRole) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatGate = (gate: string) => {
    return gate.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
            <h1 className="text-3xl font-bold text-white">Security Staff</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage security personnel and their assignments
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/security/staff-approval"
              className="relative px-4 py-2 rounded-lg border border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium flex items-center gap-2 transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
              Review Nominations
              {pendingNominations.length > 0 && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">
                  {pendingNominations.length}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/security/staff/register"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Register New Staff
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Staff</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Inactive</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.inactive}</p>
              </div>
              <div className="rounded-xl bg-zinc-500/10 p-3">
                <XCircle className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.pending}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, badge number, or email..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filters
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-3 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Roles</option>
                    <option value="security_manager">Security Manager</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="security_guard">Security Guard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Gate
                  </label>
                  <select
                    value={gateFilter}
                    onChange={(e) => setGateFilter(e.target.value as GateFilter)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Gates</option>
                    <option value="main_gate">Main Gate</option>
                    <option value="side_gate">Side Gate</option>
                    <option value="back_gate">Back Gate</option>
                    <option value="parking_gate">Parking Gate</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staff List */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
          {filteredStaff.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No staff found</p>
              <p className="text-zinc-500 text-xs mt-1">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Register new staff to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Role & Gate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {member.firstName.charAt(0)}
                            {member.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-zinc-400">
                              Badge: {member.badgeNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(
                              member.securityRole
                            )}`}
                          >
                            <Shield className="h-3 w-3" />
                            {formatRole(member.securityRole)}
                          </div>
                          {member.assignedGate && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                              <MapPin className="h-3 w-3" />
                              {formatGate(member.assignedGate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-zinc-300">
                            {member.securityCompanyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(
                            member.status
                          )}`}
                        >
                          {member.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditModal({ staff: member, isOpen: true })}
                            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {member.status === 'active' && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to deactivate ${member.firstName} ${member.lastName}?`
                                  )
                                ) {
                                  deactivateMutation.mutate(member.id);
                                }
                              }}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                              title="Deactivate"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
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

      {/* Edit Modal */}
      {editModal.isOpen && editModal.staff && (
        <EditStaffModal
          staff={editModal.staff}
          onClose={() => setEditModal({ staff: null, isOpen: false })}
          onSave={(updates) => {
            updateMutation.mutate({
              staffId: editModal.staff!.id,
              ...updates,
            });
          }}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Edit Staff Modal Component
function EditStaffModal({
  staff,
  onClose,
  onSave,
  isLoading,
}: {
  staff: SecurityStaff;
  onClose: () => void;
  onSave: (updates: {
    securityRole?: SecurityRole;
    assignedGate?: GateLocation;
    badgeNumber?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }) => void;
  isLoading: boolean;
}) {
  const [role, setRole] = useState<SecurityRole>(staff.securityRole);
  const [gate, setGate] = useState<GateLocation | undefined>(
    staff.assignedGate as GateLocation | undefined
  );
  const [badgeNumber, setBadgeNumber] = useState(staff.badgeNumber);
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>(staff.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-400" />
            Edit Staff Member
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as SecurityRole)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="security_guard">Security Guard</option>
              <option value="team_lead">Team Lead</option>
              <option value="security_manager">Security Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Assigned Gate
            </label>
            <select
              value={gate || ''}
              onChange={(e) =>
                setGate((e.target.value || undefined) as GateLocation | undefined)
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">No Gate Assigned</option>
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'active' | 'inactive' | 'suspended')
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
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
            onClick={() =>
              onSave({
                securityRole: role,
                assignedGate: gate,
                badgeNumber,
                status,
              })
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
