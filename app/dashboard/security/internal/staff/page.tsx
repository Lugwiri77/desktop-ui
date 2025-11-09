'use client';

import { useState, useMemo } from 'react';
import { Shield, Users, Search, Filter, UserPlus, Download, ChevronDown, Loader2 } from 'lucide-react';
import { useInternalSecurityStaff, useUpdateStaffRole, useUpdateStaffStatus } from '@/hooks/use-security';
import { StaffCard } from '@/app/components/security/StaffCard';
import { SecurityRole, StaffStatus } from '@/lib/security-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RoleFilter = 'all' | SecurityRole;
type StatusFilter = 'all' | StaffStatus;

export default function InternalStaffPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch internal security staff
  const { data: staff = [], isLoading, error } = useInternalSecurityStaff({
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    department: departmentFilter !== 'all' ? departmentFilter : undefined,
  });

  // Mutations
  const updateRoleMutation = useUpdateStaffRole();
  const updateStatusMutation = useUpdateStaffStatus();

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.workEmail.toLowerCase().includes(query) ||
        s.badgeNumber?.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query)
    );
  }, [staff, searchQuery]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(staff.map(s => s.department));
    return Array.from(depts).sort();
  }, [staff]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter((s) => s.isActive).length,
      managers: staff.filter((s) => s.securityRole === 'security_manager').length,
      teamLeads: staff.filter((s) => s.securityRole === 'team_lead').length,
    };
  }, [staff]);

  const handleDeactivate = async (staffMember: any) => {
    if (confirm(`Are you sure you want to deactivate ${staffMember.firstName} ${staffMember.lastName}?`)) {
      try {
        await updateStatusMutation.mutateAsync({
          staffId: staffMember.id,
          status: 'inactive',
          reason: 'Deactivated by administrator',
        });
      } catch (err) {
        console.error('Failed to deactivate staff:', err);
        alert('Failed to deactivate staff member');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error loading staff</div>
          <div className="text-zinc-500 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              Internal Security Staff
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage internal security department staff and their roles
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Export functionality
                alert('Export feature coming soon');
              }}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              Export
            </button>
            <Link
              href="/dashboard/security/internal/roles"
              className="px-4 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-medium flex items-center gap-2 transition-colors"
            >
              <Shield className="h-5 w-5" />
              Manage Roles
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
                <Shield className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Managers</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.managers}</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Team Leads</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.teamLeads}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Shield className="h-6 w-6 text-blue-400" />
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
                  placeholder="Search by name, badge, email, or department..."
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
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">No staff found</p>
            <p className="text-zinc-500 text-xs mt-1">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'No internal security staff registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map((staffMember) => (
              <StaffCard
                key={staffMember.id}
                staff={staffMember}
                onView={(staff) => router.push(`/dashboard/security/internal/staff/${staff.id}`)}
                onEdit={(staff) => router.push(`/dashboard/security/internal/staff/${staff.id}`)}
                onDeactivate={handleDeactivate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
