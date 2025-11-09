'use client';

import { useState } from 'react';
import { Shield, Check, X, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { SecurityPermission, PermissionCategory } from '@/lib/security-api';

interface PermissionMatrixProps {
  permissions: SecurityPermission[];
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  readonly?: boolean;
  showDescriptions?: boolean;
}

const CATEGORY_INFO: Record<PermissionCategory, { name: string; description: string; color: string }> = {
  visitor_management: {
    name: 'Visitor Management',
    description: 'Control visitor entry, exit, and monitoring',
    color: 'blue',
  },
  staff_management: {
    name: 'Staff Management',
    description: 'Manage security staff and assignments',
    color: 'purple',
  },
  incident_management: {
    name: 'Incident Management',
    description: 'Report and manage security incidents',
    color: 'red',
  },
  reporting: {
    name: 'Reporting',
    description: 'View and generate security reports',
    color: 'green',
  },
  system_admin: {
    name: 'System Administration',
    description: 'Configure security settings and integrations',
    color: 'orange',
  },
};

export function PermissionMatrix({
  permissions,
  selectedPermissions,
  onChange,
  readonly = false,
  showDescriptions = true,
}: PermissionMatrixProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<PermissionCategory>>(
    new Set(['visitor_management', 'staff_management'])
  );
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<PermissionCategory, SecurityPermission[]>);

  const toggleCategory = (category: PermissionCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    if (readonly) return;

    if (selectedPermissions.includes(permissionId)) {
      onChange(selectedPermissions.filter(id => id !== permissionId));
    } else {
      onChange([...selectedPermissions, permissionId]);
    }
  };

  const toggleAllInCategory = (category: PermissionCategory) => {
    if (readonly) return;

    const categoryPermissions = groupedPermissions[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all in category
      onChange(selectedPermissions.filter(id => !categoryPermissionIds.includes(id)));
    } else {
      // Select all in category
      const newPermissions = new Set([...selectedPermissions, ...categoryPermissionIds]);
      onChange(Array.from(newPermissions));
    }
  };

  const getCategoryStats = (category: PermissionCategory) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const selectedCount = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length;
    const totalCount = categoryPermissions.length;
    return { selectedCount, totalCount };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Permission Matrix
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Configure granular permissions for this role
          </p>
        </div>
        <div className="text-sm text-zinc-400">
          <span className="text-white font-semibold">{selectedPermissions.length}</span> / {permissions.length} selected
        </div>
      </div>

      {/* Permission Categories */}
      <div className="space-y-2">
        {(Object.keys(groupedPermissions) as PermissionCategory[]).map(category => {
          const categoryInfo = CATEGORY_INFO[category];
          const stats = getCategoryStats(category);
          const isExpanded = expandedCategories.has(category);
          const allSelected = stats.selectedCount === stats.totalCount && stats.totalCount > 0;
          const someSelected = stats.selectedCount > 0 && stats.selectedCount < stats.totalCount;

          return (
            <div key={category} className="rounded-lg border border-white/10 bg-zinc-900 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${categoryInfo.color}-500/10`}>
                    {isExpanded ? (
                      <ChevronDown className={`h-4 w-4 text-${categoryInfo.color}-400`} />
                    ) : (
                      <ChevronRight className={`h-4 w-4 text-${categoryInfo.color}-400`} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{categoryInfo.name}</div>
                    {showDescriptions && (
                      <div className="text-xs text-zinc-400 mt-0.5">{categoryInfo.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stats */}
                  <div className={`text-xs font-medium ${
                    allSelected ? 'text-green-400' :
                    someSelected ? 'text-blue-400' :
                    'text-zinc-500'
                  }`}>
                    {stats.selectedCount} / {stats.totalCount}
                  </div>

                  {/* Select All Checkbox */}
                  {!readonly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAllInCategory(category);
                      }}
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                        allSelected
                          ? `bg-${categoryInfo.color}-500 border-${categoryInfo.color}-500`
                          : someSelected
                          ? `bg-${categoryInfo.color}-500/50 border-${categoryInfo.color}-500`
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {allSelected && <Check className="h-3 w-3 text-white" />}
                      {someSelected && !allSelected && (
                        <div className="w-2 h-0.5 bg-white rounded" />
                      )}
                    </button>
                  )}
                </div>
              </button>

              {/* Category Permissions */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-white/5">
                  <div className="divide-y divide-white/10">
                    {groupedPermissions[category].map(permission => {
                      const isSelected = selectedPermissions.includes(permission.id);

                      return (
                        <div
                          key={permission.id}
                          className="px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => togglePermission(permission.id)}
                              disabled={readonly}
                              className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                                readonly
                                  ? 'cursor-not-allowed opacity-50'
                                  : isSelected
                                  ? `bg-${categoryInfo.color}-500 border-${categoryInfo.color}-500`
                                  : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </button>

                            {/* Permission Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {permission.displayName}
                                </span>

                                {/* Info Tooltip */}
                                {showDescriptions && permission.description && (
                                  <div className="relative">
                                    <button
                                      onMouseEnter={() => setShowTooltip(permission.id)}
                                      onMouseLeave={() => setShowTooltip(null)}
                                      className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                      <Info className="h-4 w-4" />
                                    </button>

                                    {showTooltip === permission.id && (
                                      <div className="absolute left-0 bottom-full mb-2 z-10 w-64 p-3 rounded-lg bg-zinc-950 border border-white/10 shadow-xl">
                                        <p className="text-xs text-zinc-300">{permission.description}</p>
                                        <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/10" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {showDescriptions && (
                                <p className="text-xs text-zinc-400 mt-0.5">{permission.description}</p>
                              )}
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-${categoryInfo.color}-500/10 text-${categoryInfo.color}-400`}>
                                Enabled
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {selectedPermissions.length > 0 && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/20">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-400">Selected Permissions Summary</h4>
              <p className="text-xs text-blue-300/80 mt-1">
                This role will have <span className="font-semibold">{selectedPermissions.length}</span> permission
                {selectedPermissions.length !== 1 ? 's' : ''} across{' '}
                <span className="font-semibold">
                  {Object.keys(groupedPermissions).filter(cat =>
                    groupedPermissions[cat as PermissionCategory].some(p => selectedPermissions.includes(p.id))
                  ).length}
                </span>{' '}
                categories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Read-only Notice */}
      {readonly && (
        <div className="p-3 rounded-lg bg-zinc-800 border border-white/10 flex items-center gap-2 text-sm text-zinc-400">
          <Info className="h-4 w-4" />
          <span>Permission matrix is read-only. You cannot modify these permissions.</span>
        </div>
      )}
    </div>
  );
}
