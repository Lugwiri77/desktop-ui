'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Field, Label, Description } from '@/app/components/fieldset';
import { Radio, RadioField, RadioGroup } from '@/app/components/radio';
import { Select } from '@/app/components/select';
import { Checkbox, CheckboxField } from '@/app/components/checkbox';
import { isAuthenticated } from '@/lib/api';
import {
  getStaffRBACRole,
  getDepartments,
  updateStaffRBACRole,
  type StaffRBACRole,
  type Department,
  type GranularPermissions,
} from '@/lib/graphql';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

// RBAC Role Types (for form state)
type StaffRoleType = 'Administrator' | 'HRManager' | 'ITAdministrator' | 'DepartmentManager' | 'Staff';

const roleDescriptions: Record<StaffRoleType, string> = {
  Administrator: 'Full system access - Can manage all aspects of the organization',
  HRManager: 'Human Resources - Manage staff, departments, and assign roles',
  ITAdministrator: 'IT System Admin - Manage database config, integrations, and system settings',
  DepartmentManager: 'Department Manager - Scoped access to manage a specific department',
  Staff: 'Regular Employee - Basic access with limited permissions',
};

const defaultPermissions: Record<StaffRoleType, GranularPermissions> = {
  Administrator: {
    can_update_org_settings: true,
    can_manage_database_config: true,
    can_view_org_info: true,
    can_update_org_info: true,
    can_register_staff: true,
    can_update_staff_info: true,
    can_deactivate_staff: true,
    can_view_staff_list: true,
    can_view_staff_details: true,
    can_assign_roles: true,
    can_manage_permissions: true,
    can_reset_staff_passwords: true,
    can_create_departments: true,
    can_update_departments: true,
    can_delete_departments: true,
    can_view_departments: true,
    can_assign_department_managers: true,
    can_view_department_staff: true,
    can_update_department_staff: true,
    can_approve_department_requests: true,
    can_manage_integrations: true,
    can_view_system_logs: true,
    can_manage_security_settings: true,
    can_configure_backups: true,
    can_manage_api_keys: true,
    can_view_audit_logs: true,
    can_export_reports: true,
    can_view_compliance_data: true,
    can_create: true,
    can_update: true,
    can_approve: true,
    can_delete: true,
    can_write: true,
    can_read: true,
    can_publish: true,
  },
  HRManager: {
    can_update_org_settings: false,
    can_manage_database_config: false,
    can_view_org_info: true,
    can_update_org_info: false,
    can_register_staff: true,
    can_update_staff_info: true,
    can_deactivate_staff: true,
    can_view_staff_list: true,
    can_view_staff_details: true,
    can_assign_roles: true,
    can_manage_permissions: true,
    can_reset_staff_passwords: true,
    can_create_departments: true,
    can_update_departments: true,
    can_delete_departments: true,
    can_view_departments: true,
    can_assign_department_managers: true,
    can_view_department_staff: true,
    can_update_department_staff: true,
    can_approve_department_requests: false,
    can_manage_integrations: false,
    can_view_system_logs: false,
    can_manage_security_settings: false,
    can_configure_backups: false,
    can_manage_api_keys: false,
    can_view_audit_logs: true,
    can_export_reports: true,
    can_view_compliance_data: true,
    can_create: false,
    can_update: false,
    can_approve: false,
    can_delete: false,
    can_write: false,
    can_read: true,
    can_publish: false,
  },
  ITAdministrator: {
    can_update_org_settings: false,
    can_manage_database_config: true,
    can_view_org_info: true,
    can_update_org_info: false,
    can_register_staff: false,
    can_update_staff_info: false,
    can_deactivate_staff: false,
    can_view_staff_list: true,
    can_view_staff_details: true,
    can_assign_roles: false,
    can_manage_permissions: false,
    can_reset_staff_passwords: false,
    can_create_departments: false,
    can_update_departments: false,
    can_delete_departments: false,
    can_view_departments: true,
    can_assign_department_managers: false,
    can_view_department_staff: false,
    can_update_department_staff: false,
    can_approve_department_requests: false,
    can_manage_integrations: true,
    can_view_system_logs: true,
    can_manage_security_settings: true,
    can_configure_backups: true,
    can_manage_api_keys: true,
    can_view_audit_logs: true,
    can_export_reports: false,
    can_view_compliance_data: false,
    can_create: false,
    can_update: false,
    can_approve: false,
    can_delete: false,
    can_write: false,
    can_read: true,
    can_publish: false,
  },
  DepartmentManager: {
    can_update_org_settings: false,
    can_manage_database_config: false,
    can_view_org_info: true,
    can_update_org_info: false,
    can_register_staff: false,
    can_update_staff_info: false,
    can_deactivate_staff: false,
    can_view_staff_list: true,
    can_view_staff_details: true,
    can_assign_roles: false,
    can_manage_permissions: false,
    can_reset_staff_passwords: false,
    can_create_departments: false,
    can_update_departments: false,
    can_delete_departments: false,
    can_view_departments: true,
    can_assign_department_managers: false,
    can_view_department_staff: true,
    can_update_department_staff: true,
    can_approve_department_requests: true,
    can_manage_integrations: false,
    can_view_system_logs: false,
    can_manage_security_settings: false,
    can_configure_backups: false,
    can_manage_api_keys: false,
    can_view_audit_logs: false,
    can_export_reports: true,
    can_view_compliance_data: false,
    can_create: false,
    can_update: true,
    can_approve: true,
    can_delete: false,
    can_write: true,
    can_read: true,
    can_publish: false,
  },
  Staff: {
    can_update_org_settings: false,
    can_manage_database_config: false,
    can_view_org_info: true,
    can_update_org_info: false,
    can_register_staff: false,
    can_update_staff_info: false,
    can_deactivate_staff: false,
    can_view_staff_list: false,
    can_view_staff_details: false,
    can_assign_roles: false,
    can_manage_permissions: false,
    can_reset_staff_passwords: false,
    can_create_departments: false,
    can_update_departments: false,
    can_delete_departments: false,
    can_view_departments: false,
    can_assign_department_managers: false,
    can_view_department_staff: false,
    can_update_department_staff: false,
    can_approve_department_requests: false,
    can_manage_integrations: false,
    can_view_system_logs: false,
    can_manage_security_settings: false,
    can_configure_backups: false,
    can_manage_api_keys: false,
    can_view_audit_logs: false,
    can_export_reports: false,
    can_view_compliance_data: false,
    can_create: false,
    can_update: false,
    can_approve: false,
    can_delete: false,
    can_write: false,
    can_read: true,
    can_publish: false,
  },
};

export default function StaffRBACRolesPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const queryClient = useQueryClient();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedRole, setSelectedRole] = useState<StaffRoleType>('Staff');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [permissions, setPermissions] = useState<GranularPermissions>({} as GranularPermissions);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  }, [router]);

  // Fetch staff RBAC data using GraphQL
  const { data: staffData, isLoading: staffLoading } = useQuery<StaffRBACRole | null>({
    queryKey: ['staff-rbac', staffId],
    queryFn: async () => {
      return await getStaffRBACRole(staffId);
    },
    enabled: !!userInfo && !!staffId,
  });

  // Fetch departments list using GraphQL
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      return await getDepartments();
    },
    enabled: !!userInfo,
  });

  // Update when data is loaded
  useEffect(() => {
    if (staffData) {
      if (staffData.staffRoleType) {
        setSelectedRole(staffData.staffRoleType as StaffRoleType);
      }
      if (staffData.departmentId) {
        setSelectedDepartmentId(staffData.departmentId);
      }
      if (staffData.granularPermissions) {
        // Parse JSON string to object
        const parsed = JSON.parse(staffData.granularPermissions);
        setPermissions(parsed);
      } else {
        // Set default permissions based on role
        const defaults = defaultPermissions[staffData.staffRoleType as StaffRoleType || 'Staff'];
        setPermissions({ ...({} as GranularPermissions), ...defaults });
      }
    }
  }, [staffData]);

  // Update mutation using GraphQL
  const updateMutation = useMutation({
    mutationFn: async (data: {
      staff_role_type: StaffRoleType;
      department_id?: string;
      granular_permissions: GranularPermissions;
    }) => {
      return await updateStaffRBACRole({
        staffId,
        staffRoleType: data.staff_role_type,
        departmentId: data.department_id,
        granularPermissions: JSON.stringify(data.granular_permissions),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['staff-rbac', staffId] });
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        setSuccess(response.message || 'Staff role and permissions updated successfully!');
        setTimeout(() => {
          router.push('/staff');
        }, 2000);
      } else {
        setError(response.message || 'Failed to update roles. Please try again.');
        setTimeout(() => setError(''), 5000);
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update roles. Please try again.');
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleRoleChange = (role: StaffRoleType) => {
    setSelectedRole(role);
    // Auto-fill default permissions for the role
    const defaults = defaultPermissions[role];
    setPermissions({ ...({} as GranularPermissions), ...defaults });
  };

  const handlePermissionChange = (key: keyof GranularPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'DepartmentManager' && !selectedDepartmentId) {
      setError('Please select a department for the Department Manager role');
      setTimeout(() => setError(''), 3000);
      return;
    }

    updateMutation.mutate({
      staff_role_type: selectedRole,
      department_id: selectedRole === 'DepartmentManager' ? selectedDepartmentId : undefined,
      granular_permissions: permissions,
    });
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!userInfo || staffLoading) {
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
          <Heading>Manage Staff Role & Permissions</Heading>
          {staffData && (
            <Text className="mt-2">
              {staffData.firstName} {staffData.lastName} (@{staffData.username})
            </Text>
          )}
          {staffData?.departmentName && (
            <Text className="text-sm text-gray-500">
              Department: {staffData.departmentName}
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
          {/* Role Selection */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Staff Role
            </h3>
            <Text className="text-sm mb-6">
              Select the role that defines this staff member's level of access and responsibilities in the system.
            </Text>

            <RadioGroup value={selectedRole} onChange={handleRoleChange}>
              <div className="space-y-4">
                {(Object.keys(roleDescriptions) as StaffRoleType[]).map((role) => (
                  <RadioField key={role}>
                    <Radio value={role} />
                    <Label>{role.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Description>{roleDescriptions[role]}</Description>
                  </RadioField>
                ))}
              </div>
            </RadioGroup>

            {/* Department Selection for Department Manager */}
            {selectedRole === 'DepartmentManager' && (
              <Field className="mt-6">
                <Label>Managed Department *</Label>
                <Description>Select which department this manager will oversee</Description>
                <Select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="mt-2"
                >
                  <option value="">Select a department</option>
                  {departmentsData?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          {/* Granular Permissions */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Granular Permissions
            </h3>
            <Text className="text-sm mb-6">
              Fine-tune specific permissions for this staff member. These are pre-filled based on the selected role but can be customized.
            </Text>

            <div className="space-y-6">
              {/* Organization Permissions */}
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Organization & Settings
                </h4>
                <div className="space-y-2">
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_update_org_settings || false}
                      onChange={() => handlePermissionChange('can_update_org_settings')}
                    />
                    <Label>Can update organization settings</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_manage_database_config || false}
                      onChange={() => handlePermissionChange('can_manage_database_config')}
                    />
                    <Label>Can manage database configuration</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_view_org_info || false}
                      onChange={() => handlePermissionChange('can_view_org_info')}
                    />
                    <Label>Can view organization information</Label>
                  </CheckboxField>
                </div>
              </div>

              {/* Staff Management Permissions */}
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Staff Management
                </h4>
                <div className="space-y-2">
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_register_staff || false}
                      onChange={() => handlePermissionChange('can_register_staff')}
                    />
                    <Label>Can register new staff</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_update_staff_info || false}
                      onChange={() => handlePermissionChange('can_update_staff_info')}
                    />
                    <Label>Can update staff information</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_view_staff_list || false}
                      onChange={() => handlePermissionChange('can_view_staff_list')}
                    />
                    <Label>Can view staff list</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_assign_roles || false}
                      onChange={() => handlePermissionChange('can_assign_roles')}
                    />
                    <Label>Can assign roles to staff</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_reset_staff_passwords || false}
                      onChange={() => handlePermissionChange('can_reset_staff_passwords')}
                    />
                    <Label>Can reset staff passwords</Label>
                  </CheckboxField>
                </div>
              </div>

              {/* Department Management Permissions */}
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Department Management
                </h4>
                <div className="space-y-2">
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_create_departments || false}
                      onChange={() => handlePermissionChange('can_create_departments')}
                    />
                    <Label>Can create departments</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_update_departments || false}
                      onChange={() => handlePermissionChange('can_update_departments')}
                    />
                    <Label>Can update departments</Label>
                  </CheckboxField>
                  <CheckboxField>
                    <Checkbox
                      checked={permissions.can_view_departments || false}
                      onChange={() => handlePermissionChange('can_view_departments')}
                    />
                    <Label>Can view departments</Label>
                  </CheckboxField>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/staff')}
              outline
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
