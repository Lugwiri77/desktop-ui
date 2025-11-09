'use client';

import { Shield, Check, Lock } from 'lucide-react';
import { SecurityRole, formatSecurityRole } from '@/lib/security-api';
import { useState } from 'react';

interface RoleSelectorProps {
  value: SecurityRole;
  onChange: (role: SecurityRole) => void;
  disabled?: boolean;
  showPermissions?: boolean;
  restrictedRoles?: SecurityRole[]; // Roles that current user cannot assign
  label?: string;
  error?: string;
}

const ROLE_PERMISSIONS: Record<SecurityRole, string[]> = {
  security_manager: [
    'Manage all security staff',
    'Assign shifts and gates',
    'View all reports',
    'Manage incidents',
    'Configure security settings',
    'Approve nominations',
  ],
  team_lead: [
    'Assign shifts to guards',
    'View team reports',
    'Report incidents',
    'Monitor gate activities',
    'Manage team schedules',
  ],
  security_guard: [
    'Scan visitor QR codes',
    'Report incidents',
    'View assigned visitors',
    'Check-in/out shifts',
  ],
};

const ROLE_DESCRIPTIONS: Record<SecurityRole, string> = {
  security_manager: 'Full access to all security operations and staff management',
  team_lead: 'Supervise security guards and manage team operations',
  security_guard: 'Handle visitor entry/exit and monitor assigned gates',
};

const ROLES: SecurityRole[] = ['security_manager', 'team_lead', 'security_guard'];

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  showPermissions = true,
  restrictedRoles = [],
  label = 'Security Role',
  error,
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isRoleRestricted = (role: SecurityRole) => restrictedRoles.includes(role);

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-white">
        {label}
        {disabled && (
          <span className="ml-2 text-xs text-zinc-500">(Read-only)</span>
        )}
      </label>

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
            disabled
              ? 'border-white/5 bg-white/5 text-zinc-500 cursor-not-allowed'
              : error
              ? 'border-red-500/50 bg-red-500/5 text-white hover:border-red-500'
              : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-sm font-medium">{formatSecurityRole(value)}</div>
              {showPermissions && (
                <div className="text-xs text-zinc-400 mt-0.5">
                  {ROLE_DESCRIPTIONS[value]}
                </div>
              )}
            </div>
          </div>
          {!disabled && (
            <svg
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute z-20 w-full mt-2 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
              {ROLES.map((role) => {
                const isSelected = value === role;
                const isRestricted = isRoleRestricted(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      if (!isRestricted) {
                        onChange(role);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isRestricted}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      isRestricted
                        ? 'opacity-50 cursor-not-allowed bg-white/5'
                        : isSelected
                        ? 'bg-blue-500/10 hover:bg-blue-500/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : isRestricted ? (
                          <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center">
                            <Lock className="h-3 w-3 text-zinc-500" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {formatSecurityRole(role)}
                          </span>
                          {isRestricted && (
                            <span className="text-xs text-zinc-500">(Restricted)</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {ROLE_DESCRIPTIONS[role]}
                        </p>

                        {/* Permissions Preview */}
                        {showPermissions && !isRestricted && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ROLE_PERMISSIONS[role].slice(0, 3).map((permission, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/5 text-zinc-400"
                              >
                                {permission}
                              </span>
                            ))}
                            {ROLE_PERMISSIONS[role].length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/5 text-zinc-400">
                                +{ROLE_PERMISSIONS[role].length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected Role Permissions */}
      {showPermissions && !isOpen && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Permissions
          </h4>
          <div className="space-y-1.5">
            {ROLE_PERMISSIONS[value].map((permission, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                <span>{permission}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
