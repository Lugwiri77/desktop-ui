'use client';

import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, ArrowLeft } from 'lucide-react';
import { useSecurityRoles, useAvailablePermissions, useCreateSecurityRole, useUpdateSecurityRole, useDeleteSecurityRole } from '@/hooks/use-security';
import { PermissionMatrix } from '@/app/components/security/PermissionMatrix';
import { useRouter } from 'next/navigation';
import { CreateRoleInput } from '@/lib/security-api';

export default function RolesManagementPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const { data: roles = [], isLoading } = useSecurityRoles();
  const { data: availablePermissions = [] } = useAvailablePermissions();
  const createRoleMutation = useCreateSecurityRole();
  const updateRoleMutation = useUpdateSecurityRole();
  const deleteRoleMutation = useDeleteSecurityRole();

  const handleCreateRole = async (roleData: CreateRoleInput) => {
    try {
      await createRoleMutation.mutateAsync(roleData);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create role:', err);
      alert('Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId: string, updates: any) => {
    try {
      await updateRoleMutation.mutateAsync({ roleId, ...updates });
      setEditingRole(null);
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      try {
        await deleteRoleMutation.mutateAsync(roleId);
      } catch (err) {
        console.error('Failed to delete role:', err);
        alert('Failed to delete role');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-400" />
                Security Roles
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Create and manage security roles with granular permissions
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Role
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border border-white/10 bg-zinc-900 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{role.displayName}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{role.description}</p>
                </div>
                {!role.isDefault && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingRole(role)}
                      className="p-2 rounded-lg hover:bg-white/10 text-blue-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id, role.displayName)}
                      className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Users className="h-4 w-4" />
                  <span>{role.staffCount} staff assigned</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Shield className="h-4 w-4" />
                  <span>{role.permissions.length} permissions</span>
                </div>
                {role.isDefault && (
                  <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/50">
                    Default Role
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingRole) && (
          <RoleModal
            role={editingRole}
            availablePermissions={availablePermissions}
            onSave={editingRole ? (data) => handleUpdateRole(editingRole.id, data) : handleCreateRole}
            onClose={() => {
              setShowCreateModal(false);
              setEditingRole(null);
            }}
            isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// Role Modal Component
function RoleModal({ role, availablePermissions, onSave, onClose, isLoading }: any) {
  const [displayName, setDisplayName] = useState(role?.displayName || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions.map((p: any) => p.id) || []
  );

  const handleSave = () => {
    if (!displayName || !description) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      name: displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName,
      description,
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-4xl w-full p-6 my-8">
        <h2 className="text-xl font-bold text-white mb-6">
          {role ? 'Edit Role' : 'Create New Role'}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Team Lead"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the responsibilities of this role..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <PermissionMatrix
            permissions={availablePermissions}
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
            showDescriptions={true}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
