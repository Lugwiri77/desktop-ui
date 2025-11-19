'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Label, Description } from '@/app/components/fieldset';
import { Checkbox, CheckboxField } from '@/app/components/checkbox';
import { isAuthenticated, get, put } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

interface Roles {
  is_super_admin: boolean;
  is_chief_executive_officer: boolean;
  is_chairman: boolean;
  is_board_of_directors: boolean;
  is_director: boolean;
  is_admin: boolean;
  is_hr: boolean;
  is_procurement: boolean;
  is_finance: boolean;
  is_maintenance: boolean;
  is_public_relations: boolean;
  is_security: boolean;
  is_store_keeper: boolean;
  is_transport: boolean;
  // Executive support staff roles (for VIP visitor auto-routing)
  is_secretary: boolean;
  is_executive_assistant: boolean;
  is_personal_assistant: boolean;
}

interface Permissions {
  can_create: boolean;
  can_update: boolean;
  can_approve: boolean;
  can_delete: boolean;
  can_write: boolean;
  can_read: boolean;
  can_publish: boolean;
}

interface StaffRolesPermissions {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  work_email: string;
  designation?: string;
  department?: string;
  roles: Roles;
  permissions: Permissions;
}

interface RolesPermissionsResponse {
  status: string;
  message: string;
  data: StaffRolesPermissions;
}

export default function StaffRolesPermissionsClient() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [staffData, setStaffData] = useState<StaffRolesPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [roles, setRoles] = useState<Roles>({
    is_super_admin: false,
    is_chief_executive_officer: false,
    is_chairman: false,
    is_board_of_directors: false,
    is_director: false,
    is_admin: false,
    is_hr: false,
    is_procurement: false,
    is_finance: false,
    is_maintenance: false,
    is_public_relations: false,
    is_security: false,
    is_store_keeper: false,
    is_transport: false,
    // Executive support staff roles
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
  });

  const [permissions, setPermissions] = useState<Permissions>({
    can_create: false,
    can_update: false,
    can_approve: false,
    can_delete: false,
    can_write: false,
    can_read: false,
    can_publish: false,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    fetchStaffRolesPermissions();
  }, [router, staffId]);

  const fetchStaffRolesPermissions = async () => {
    try {
      setLoading(true);
      const response = await get<RolesPermissionsResponse>(`/auth/staff/${staffId}/roles-permissions`);
      setStaffData(response.data);
      setRoles(response.data.roles);
      setPermissions(response.data.permissions);
    } catch (err) {
      console.error('Error fetching staff roles and permissions:', err);
      setError('Failed to load staff roles and permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: keyof Roles) => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const handlePermissionChange = (permission: keyof Permissions) => {
    setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await put(`/auth/staff/${staffId}/roles-permissions`, {
        roles,
        permissions,
      });

      setSuccess('Roles and permissions updated successfully!');
      setTimeout(() => {
        router.push('/staff');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update roles and permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!userInfo || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);

  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-4xl space-y-6">
        <div>
          <Button onClick={() => router.push('/staff')} className="mb-4">
            ← Back to Staff List
          </Button>
          <Heading>Manage Roles & Permissions</Heading>
          {staffData && (
            <Text className="mt-2">
              {staffData.first_name} {staffData.last_name} (@{staffData.username})
              {staffData.designation && ` - ${staffData.designation}`}
            </Text>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Roles Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Roles</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Select the roles that apply to this staff member. Roles determine high-level responsibilities and access levels.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CheckboxField>
                <Checkbox
                  checked={roles.is_super_admin}
                  onChange={() => handleRoleChange('is_super_admin')}
                />
                <Label>Super Admin</Label>
                <Description>Full system access and control</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_chief_executive_officer}
                  onChange={() => handleRoleChange('is_chief_executive_officer')}
                />
                <Label>Chief Executive Officer</Label>
                <Description>Executive leadership role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_chairman}
                  onChange={() => handleRoleChange('is_chairman')}
                />
                <Label>Chairman</Label>
                <Description>Board chairman role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_board_of_directors}
                  onChange={() => handleRoleChange('is_board_of_directors')}
                />
                <Label>Board of Directors</Label>
                <Description>Board member role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_director}
                  onChange={() => handleRoleChange('is_director')}
                />
                <Label>Director</Label>
                <Description>Department director role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_admin}
                  onChange={() => handleRoleChange('is_admin')}
                />
                <Label>Admin</Label>
                <Description>Administrative access</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_hr}
                  onChange={() => handleRoleChange('is_hr')}
                />
                <Label>Human Resources</Label>
                <Description>HR department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_procurement}
                  onChange={() => handleRoleChange('is_procurement')}
                />
                <Label>Procurement</Label>
                <Description>Procurement department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_finance}
                  onChange={() => handleRoleChange('is_finance')}
                />
                <Label>Finance</Label>
                <Description>Finance department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_maintenance}
                  onChange={() => handleRoleChange('is_maintenance')}
                />
                <Label>Maintenance</Label>
                <Description>Maintenance department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_public_relations}
                  onChange={() => handleRoleChange('is_public_relations')}
                />
                <Label>Public Relations</Label>
                <Description>PR department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_security}
                  onChange={() => handleRoleChange('is_security')}
                />
                <Label>Security</Label>
                <Description>Security department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_store_keeper}
                  onChange={() => handleRoleChange('is_store_keeper')}
                />
                <Label>Store Keeper</Label>
                <Description>Store management role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_transport}
                  onChange={() => handleRoleChange('is_transport')}
                />
                <Label>Transport</Label>
                <Description>Transport department role</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_secretary}
                  onChange={() => handleRoleChange('is_secretary')}
                />
                <Label>Secretary</Label>
                <Description>Executive secretary role (handles VIP visitors)</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_executive_assistant}
                  onChange={() => handleRoleChange('is_executive_assistant')}
                />
                <Label>Executive Assistant</Label>
                <Description>Executive assistant role (handles VIP visitors)</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={roles.is_personal_assistant}
                  onChange={() => handleRoleChange('is_personal_assistant')}
                />
                <Label>Personal Assistant</Label>
                <Description>Personal assistant role (handles VIP visitors)</Description>
              </CheckboxField>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Permissions</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Define specific actions this staff member can perform. Permissions control granular access to features and operations.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CheckboxField>
                <Checkbox
                  checked={permissions.can_create}
                  onChange={() => handlePermissionChange('can_create')}
                />
                <Label>Can Create</Label>
                <Description>Create new records and entries</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_update}
                  onChange={() => handlePermissionChange('can_update')}
                />
                <Label>Can Update</Label>
                <Description>Modify existing records</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_approve}
                  onChange={() => handlePermissionChange('can_approve')}
                />
                <Label>Can Approve</Label>
                <Description>Approve requests and submissions</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_delete}
                  onChange={() => handlePermissionChange('can_delete')}
                />
                <Label>Can Delete</Label>
                <Description>Delete records permanently</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_write}
                  onChange={() => handlePermissionChange('can_write')}
                />
                <Label>Can Write</Label>
                <Description>Write and edit content</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_read}
                  onChange={() => handlePermissionChange('can_read')}
                />
                <Label>Can Read</Label>
                <Description>View and read content</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox
                  checked={permissions.can_publish}
                  onChange={() => handlePermissionChange('can_publish')}
                />
                <Label>Can Publish</Label>
                <Description>Publish content publicly</Description>
              </CheckboxField>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/staff')}
              className="bg-zinc-500 hover:bg-zinc-600"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
