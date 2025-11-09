'use client';

import { useParams, useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Edit, Save, X, Calendar, Activity, TrendingUp, AlertCircle, Clock, MapPin, Mail, Phone } from 'lucide-react';
import { useInternalSecurityStaffById, useStaffActivity, usePerformanceMetrics, useUpdateStaffRole } from '@/hooks/use-security';
import { RoleSelector } from '@/app/components/security/RoleSelector';
import { GateAssignment } from '@/app/components/security/GateAssignment';
import { PermissionMatrix } from '@/app/components/security/PermissionMatrix';
import { useState } from 'react';
import { SecurityRole, GateLocation } from '@/lib/security-api';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [editedRole, setEditedRole] = useState<SecurityRole>('security_guard');
  const [editedGate, setEditedGate] = useState<GateLocation | undefined>();
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Fetch staff data
  const { data: staff, isLoading, error } = useInternalSecurityStaffById(staffId);
  const { data: activity = [] } = useStaffActivity(staffId, 10);
  const { data: metrics } = usePerformanceMetrics(staffId, selectedPeriod);

  // Mutations
  const updateRoleMutation = useUpdateStaffRole();

  // Initialize edit form when staff data loads
  useState(() => {
    if (staff && !isEditing) {
      setEditedRole(staff.securityRole);
      setEditedGate(staff.assignedGate);
      setEditedPermissions(staff.permissions);
    }
  });

  const handleSave = async () => {
    try {
      await updateRoleMutation.mutateAsync({
        staffId: staff!.id,
        securityRole: editedRole,
        permissions: editedPermissions,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update staff:', err);
      alert('Failed to update staff member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 text-lg mb-2">Error loading staff member</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {staff.firstName} {staff.lastName}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">{staff.workEmail}</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
            >
              <Edit className="h-5 w-5" />
              Edit Details
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateRoleMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex flex-col items-center text-center">
                {staff.profilePicUrl ? (
                  <img
                    src={staff.profilePicUrl}
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="h-24 w-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                  </div>
                )}

                <h3 className="text-lg font-bold text-white">
                  {staff.firstName} {staff.lastName}
                </h3>
                <p className="text-sm text-zinc-400 mt-1">{staff.department}</p>

                <div className="mt-4 w-full space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">{staff.workEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">{staff.phoneNumber}</span>
                  </div>
                  {staff.badgeNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-300">Badge: {staff.badgeNumber}</span>
                    </div>
                  )}
                  {staff.assignedGate && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-300">{staff.assignedGate}</span>
                    </div>
                  )}
                </div>

                <div className={`mt-4 w-full px-3 py-1.5 rounded-lg text-sm font-medium ${
                  staff.isActive
                    ? 'bg-green-500/10 text-green-400 border border-green-500/50'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/50'
                }`}>
                  {staff.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            {metrics && (
              <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Performance
                  </h3>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="text-xs rounded border border-white/10 bg-white/5 px-2 py-1 text-white"
                  >
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-zinc-400">Shifts Completed</div>
                    <div className="text-2xl font-bold text-white">{metrics.shiftsCompleted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">On-Time Rate</div>
                    <div className="text-2xl font-bold text-green-400">{metrics.onTimePercentage}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Incidents Reported</div>
                    <div className="text-2xl font-bold text-white">{metrics.incidentsReported}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Role & Permissions */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Role & Permissions</h3>

              <div className="space-y-6">
                <RoleSelector
                  value={isEditing ? editedRole : staff.securityRole}
                  onChange={setEditedRole}
                  disabled={!isEditing}
                  showPermissions={!isEditing}
                />

                {!isEditing && <GateAssignment
                  value={staff.assignedGate}
                  onChange={setEditedGate}
                  disabled={true}
                />}

                {isEditing && (
                  <PermissionMatrix
                    permissions={[]} // Would come from useAvailablePermissions()
                    selectedPermissions={editedPermissions}
                    onChange={setEditedPermissions}
                    readonly={false}
                  />
                )}
              </div>
            </div>

            {/* Activity Log */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {activity.length === 0 ? (
                  <p className="text-sm text-zinc-500">No recent activity</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-white/5">
                      <Clock className="h-4 w-4 text-zinc-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.description}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
