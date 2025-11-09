'use client';

import { Shield, MapPin, Building2, MoreVertical, Edit, Eye, UserX, Calendar } from 'lucide-react';
import { InternalSecurityStaff, ExternalSecurityStaff } from '@/lib/security-api';
import { formatGateLocation, formatSecurityRole, getRoleColor, getStatusColor } from '@/lib/security-api';
import { useState } from 'react';

type Staff = InternalSecurityStaff | ExternalSecurityStaff;

interface StaffCardProps {
  staff: Staff;
  onEdit?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  onDeactivate?: (staff: Staff) => void;
  onAssignShift?: (staff: Staff) => void;
  showSource?: boolean; // Show registration source for external staff
  compact?: boolean;
}

export function StaffCard({
  staff,
  onEdit,
  onView,
  onDeactivate,
  onAssignShift,
  showSource = false,
  compact = false,
}: StaffCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isExternal = 'source' in staff;
  const roleColor = getRoleColor(staff.securityRole);
  const statusColor = getStatusColor('status' in staff ? staff.status : (staff.isActive ? 'active' : 'inactive'));

  const initials = `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`;

  return (
    <div className="group relative rounded-xl border border-white/10 bg-zinc-900 p-4 hover:border-white/20 hover:bg-zinc-900/80 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          {staff.profilePicUrl ? (
            <img
              src={staff.profilePicUrl}
              alt={`${staff.firstName} ${staff.lastName}`}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-${roleColor}-500 to-${roleColor}-600 flex items-center justify-center text-white font-semibold`}>
              {initials}
            </div>
          )}
          {/* Status Indicator */}
          <div
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900 ${
              staff.isActive ? 'bg-green-500' : 'bg-zinc-500'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-xs text-zinc-400 truncate">{staff.workEmail}</p>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
                    {onView && (
                      <button
                        onClick={() => {
                          onView(staff);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(staff);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Details
                      </button>
                    )}
                    {onAssignShift && (
                      <button
                        onClick={() => {
                          onAssignShift(staff);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        Assign Shift
                      </button>
                    )}
                    {onDeactivate && staff.isActive && (
                      <>
                        <div className="h-px bg-white/10" />
                        <button
                          onClick={() => {
                            onDeactivate(staff);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {!compact && (
            <div className="mt-2 space-y-2">
              {/* Badge Number */}
              {staff.badgeNumber && (
                <div className="text-xs text-zinc-400">
                  Badge: <span className="text-zinc-300 font-medium">{staff.badgeNumber}</span>
                </div>
              )}

              {/* Role */}
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border bg-${roleColor}-500/10 text-${roleColor}-400 border-${roleColor}-500/50`}>
                <Shield className="h-3 w-3" />
                {formatSecurityRole(staff.securityRole)}
              </div>

              {/* Assigned Gate */}
              {staff.assignedGate && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin className="h-3 w-3" />
                  {formatGateLocation(staff.assignedGate)}
                </div>
              )}

              {/* Company (for external staff) */}
              {isExternal && (staff as ExternalSecurityStaff).securityCompanyName && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Building2 className="h-3 w-3" />
                  {(staff as ExternalSecurityStaff).securityCompanyName}
                </div>
              )}

              {/* Source Badge (for external staff) */}
              {showSource && isExternal && (
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      (staff as ExternalSecurityStaff).source === 'nominated'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/50'
                    }`}
                  >
                    {(staff as ExternalSecurityStaff).source === 'nominated' ? 'Nominated' : 'Manual Registration'}
                  </span>
                </div>
              )}

              {/* Department (for internal staff) */}
              {!isExternal && (staff as InternalSecurityStaff).department && (
                <div className="text-xs text-zinc-400">
                  Department: <span className="text-zinc-300">{(staff as InternalSecurityStaff).department}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compact Mode Info */}
      {compact && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded text-${roleColor}-400 bg-${roleColor}-500/10 border border-${roleColor}-500/50`}>
            {formatSecurityRole(staff.securityRole)}
          </span>
          {staff.assignedGate && (
            <span className="text-zinc-400">
              {formatGateLocation(staff.assignedGate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
