'use client';

import { useState } from 'react';
import { MoreVertical, MapPin, Key, Calendar, UserX, UserPlus } from 'lucide-react';
import { Badge } from '../badge';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../dropdown';
import { ExternalSecurityStaff, InternalSecurityStaff } from '@/lib/security-api';
import { ResetPasswordModal } from './ResetPasswordModal';

interface StaffListProps {
  staff: (ExternalSecurityStaff | InternalSecurityStaff)[];
  isLoading?: boolean;
  isExternal?: boolean;
  onResetPassword?: (staffId: string, staffName: string) => void;
  onDeactivate?: (staffId: string, staffName: string) => void;
  onReactivate?: (staffId: string) => void;
  onAssignGate?: (staffId: string) => void;
  onCreateShift?: (staffId: string) => void;
}

export function StaffList({
  staff,
  isLoading = false,
  isExternal = false,
  onResetPassword,
  onDeactivate,
  onReactivate,
  onAssignGate,
  onCreateShift,
}: StaffListProps) {
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const handleResetPassword = (staffMember: ExternalSecurityStaff | InternalSecurityStaff) => {
    const name = `${staffMember.firstName} ${staffMember.lastName}`;
    setSelectedStaff({ id: staffMember.id, name });
    setShowResetPasswordModal(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Staff</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Gate</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                    Loading staff...
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-12 text-center">
        <p className="text-zinc-400">No staff members found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Staff</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Gate</th>
                {isExternal && (
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Source</th>
                )}
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {staff.map((staffMember) => {
                const externalStaff = isExternal ? (staffMember as ExternalSecurityStaff) : null;

                return (
                  <tr key={staffMember.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {staffMember.profilePicUrl ? (
                          <img
                            src={staffMember.profilePicUrl}
                            alt={`${staffMember.firstName} ${staffMember.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <span className="text-sm font-medium text-blue-400">
                              {staffMember.firstName[0]}
                              {staffMember.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {staffMember.firstName} {staffMember.lastName}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {staffMember.badgeNumber
                              ? `Badge: ${staffMember.badgeNumber}`
                              : 'No badge'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{staffMember.workEmail}</p>
                      <p className="text-xs text-zinc-400">{staffMember.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color="blue">
                        {staffMember.securityRole.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {staffMember.assignedGate ? (
                          <>
                            <MapPin className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-white">
                              {staffMember.assignedGate.replace('_', ' ')}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-zinc-500 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    {isExternal && externalStaff && (
                      <td className="px-6 py-4">
                        <Badge color={externalStaff.source === 'nominated' ? 'purple' : 'zinc'}>
                          {externalStaff.source}
                        </Badge>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <Badge color={staffMember.isActive ? 'green' : 'red'}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Dropdown>
                          <DropdownButton plain>
                            <MoreVertical className="h-5 w-5" />
                          </DropdownButton>
                          <DropdownMenu anchor="bottom end">
                            {isExternal && onResetPassword && (
                              <DropdownItem onClick={() => handleResetPassword(staffMember)}>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownItem>
                            )}
                            {onAssignGate && (
                              <DropdownItem onClick={() => onAssignGate(staffMember.id)}>
                                <MapPin className="h-4 w-4 mr-2" />
                                Assign Gate
                              </DropdownItem>
                            )}
                            {onCreateShift && (
                              <DropdownItem onClick={() => onCreateShift(staffMember.id)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Create Shift
                              </DropdownItem>
                            )}
                            {staffMember.isActive ? (
                              onDeactivate && (
                                <DropdownItem
                                  onClick={() =>
                                    onDeactivate(
                                      staffMember.id,
                                      `${staffMember.firstName} ${staffMember.lastName}`
                                    )
                                  }
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownItem>
                              )
                            ) : (
                              onReactivate && (
                                <DropdownItem onClick={() => onReactivate(staffMember.id)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Reactivate
                                </DropdownItem>
                              )
                            )}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {selectedStaff && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedStaff(null);
          }}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
        />
      )}
    </>
  );
}
