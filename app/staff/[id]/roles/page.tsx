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
type StaffRoleType = 'Administrator' | 'CEO' | 'HRManager' | 'ITAdministrator' | 'DepartmentManager' | 'Staff';

const roleDescriptions: Record<StaffRoleType, string> = {
  Administrator: 'Full system access - Can manage all aspects of the organization',
  CEO: 'Chief Executive Officer - Executive leadership with full system access',
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
    // Visitor Management - Administrator has all permissions
    can_scan_visitor_entry: true,
    can_scan_visitor_exit: true,
    can_view_visitor_logs: true,
    can_manage_security_alerts: true,
    can_route_visitors: true,
    can_assign_visitor_destination: true,
    can_update_visitor_status: true,
    can_send_visitor_notifications: true,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: true,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: true,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
  },
  CEO: {
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
    can_scan_visitor_entry: true,
    can_scan_visitor_exit: true,
    can_view_visitor_logs: true,
    can_manage_security_alerts: true,
    can_route_visitors: true,
    can_assign_visitor_destination: true,
    can_update_visitor_status: true,
    can_send_visitor_notifications: true,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: true,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: true,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
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
    // Visitor Management - HR Manager has routing and analytics permissions
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: true,
    can_manage_security_alerts: false,
    can_route_visitors: true,
    can_assign_visitor_destination: true,
    can_update_visitor_status: true,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: false,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: true,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
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
    // Visitor Management - IT Admin has view-only analytics for system monitoring
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: true,
    can_manage_security_alerts: false,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: false,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: false,
    can_mark_visitor_served: false,
    can_transfer_visitors: false,
    can_view_visitor_history: false,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
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
    // Visitor Management - Department Manager has service permissions + analytics
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: true,
    can_manage_security_alerts: false,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: true,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: true,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: false,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
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
    // Visitor Management - Staff has no visitor permissions by default (can be customized)
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: false,
    can_manage_security_alerts: false,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: false,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: false,
    can_mark_visitor_served: false,
    can_transfer_visitors: false,
    can_view_visitor_history: false,
    can_view_visitor_analytics: false,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
    is_chief_executive_officer: false,
    is_secretary: false,
    is_executive_assistant: false,
    is_personal_assistant: false,
  },
};

// Visitor Management Permission Presets
// These are applied to Staff or DepartmentManager roles based on their department
const visitorPermissionPresets = {
  securityOfficer: {
    can_scan_visitor_entry: true,
    can_scan_visitor_exit: true,
    can_view_visitor_logs: true,
    can_manage_security_alerts: true,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: false,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: false,
    can_mark_visitor_served: false,
    can_transfer_visitors: false,
    can_view_visitor_history: true,
    can_view_visitor_analytics: false,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
  },
  customerCareOfficer: {
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: true,
    can_manage_security_alerts: false,
    can_route_visitors: true,
    can_assign_visitor_destination: true,
    can_update_visitor_status: true,
    can_send_visitor_notifications: true,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: false,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: false,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
  },
  externalSecurity: {
    can_scan_visitor_entry: true,
    can_scan_visitor_exit: true,
    can_view_visitor_logs: false,
    can_manage_security_alerts: false,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: false,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: false,
    can_mark_visitor_served: false,
    can_transfer_visitors: false,
    can_view_visitor_history: false,
    can_view_visitor_analytics: false,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
  },
  departmentStaff: {
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: false,
    can_manage_security_alerts: false,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: true,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: true,
    can_transfer_visitors: true,
    can_view_visitor_history: false,
    can_view_visitor_analytics: false,
    can_export_visitor_reports: false,
    can_generate_visitor_insights: false,
  },
  securityManager: {
    can_scan_visitor_entry: true,
    can_scan_visitor_exit: true,
    can_view_visitor_logs: true,
    can_manage_security_alerts: true,
    can_route_visitors: false,
    can_assign_visitor_destination: false,
    can_update_visitor_status: false,
    can_send_visitor_notifications: false,
    can_view_assigned_visitors: false,
    can_mark_visitor_served: false,
    can_transfer_visitors: false,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: false,
  },
  customerCareManager: {
    can_scan_visitor_entry: false,
    can_scan_visitor_exit: false,
    can_view_visitor_logs: true,
    can_manage_security_alerts: false,
    can_route_visitors: true,
    can_assign_visitor_destination: true,
    can_update_visitor_status: true,
    can_send_visitor_notifications: true,
    can_view_assigned_visitors: true,
    can_mark_visitor_served: false,
    can_transfer_visitors: true,
    can_view_visitor_history: true,
    can_view_visitor_analytics: true,
    can_export_visitor_reports: true,
    can_generate_visitor_insights: false,
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

  const applyVisitorPreset = (presetName: keyof typeof visitorPermissionPresets) => {
    const preset = visitorPermissionPresets[presetName];
    setPermissions(prev => ({ ...prev, ...preset }));
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

              {/* Visitor Management Permissions */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  🎫 Visitor Management
                </h4>
                <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                  Control access to visitor tracking, security gate, customer care routing, and department service operations.
                </Text>

                {/* Quick Presets for Visitor Permissions */}
                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    Quick Presets (Apply common permission sets)
                  </h5>
                  <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                    Select the appropriate department first, then apply the matching preset. These presets only affect visitor management permissions.
                  </Text>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('securityOfficer')}
                      className="px-3 py-2 text-xs text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Security Officer</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Entry/exit scanning + logs + alerts</div>
                      <div className="text-[10px] text-zinc-400 mt-1">For: Security Dept Staff</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('securityManager')}
                      className="px-3 py-2 text-xs text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Security Manager</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Security ops + analytics + reports</div>
                      <div className="text-[10px] text-zinc-400 mt-1">For: Security Dept Manager</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('customerCareOfficer')}
                      className="px-3 py-2 text-xs text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Customer Care Officer</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Route visitors + assign destinations</div>
                      <div className="text-[10px] text-zinc-400 mt-1">For: Customer Management Dept Staff</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('customerCareManager')}
                      className="px-3 py-2 text-xs text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Customer Care Manager</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Routing ops + analytics + reports</div>
                      <div className="text-[10px] text-zinc-400 mt-1">For: Customer Management Dept Manager</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('departmentStaff')}
                      className="px-3 py-2 text-xs text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Department Staff</div>
                      <div className="text-zinc-500 dark:text-zinc-400">View assigned + mark served + transfer</div>
                      <div className="text-[10px] text-zinc-400 mt-1">For: Any Dept Staff serving visitors</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVisitorPreset('externalSecurity')}
                      className="px-3 py-2 text-xs text-left bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-700 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <div className="font-medium text-red-900 dark:text-red-200">⚠️ External Security</div>
                      <div className="text-red-700 dark:text-red-400">Entry/exit scanning ONLY</div>
                      <div className="text-[10px] text-red-600 dark:text-red-500 mt-1">MINIMAL access for contractors</div>
                    </button>
                  </div>
                </div>

                {/* Security Operations */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Security Operations (Security Department)
                  </h5>
                  <div className="space-y-2 pl-2">
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_scan_visitor_entry || false}
                        onChange={() => handlePermissionChange('can_scan_visitor_entry')}
                      />
                      <Label>Can scan visitor entry</Label>
                      <Description>Scan QR codes and verify OTP at entry gate</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_scan_visitor_exit || false}
                        onChange={() => handlePermissionChange('can_scan_visitor_exit')}
                      />
                      <Label>Can scan visitor exit</Label>
                      <Description>Process visitor checkout at exit gate</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_view_visitor_logs || false}
                        onChange={() => handlePermissionChange('can_view_visitor_logs')}
                      />
                      <Label>Can view visitor logs</Label>
                      <Description>Access complete visitor entry/exit records</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_manage_security_alerts || false}
                        onChange={() => handlePermissionChange('can_manage_security_alerts')}
                      />
                      <Label>Can manage security alerts</Label>
                      <Description>Receive and manage visitor security notifications</Description>
                    </CheckboxField>
                  </div>
                </div>

                {/* Customer Care Operations */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Customer Care Operations (Customer Management Department)
                  </h5>
                  <div className="space-y-2 pl-2">
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_route_visitors || false}
                        onChange={() => handlePermissionChange('can_route_visitors')}
                      />
                      <Label>Can route visitors</Label>
                      <Description>Assign visitors to departments and staff</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_assign_visitor_destination || false}
                        onChange={() => handlePermissionChange('can_assign_visitor_destination')}
                      />
                      <Label>Can assign visitor destination</Label>
                      <Description>Set office location and specific staff member</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_update_visitor_status || false}
                        onChange={() => handlePermissionChange('can_update_visitor_status')}
                      />
                      <Label>Can update visitor status</Label>
                      <Description>Change visitor workflow status</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_send_visitor_notifications || false}
                        onChange={() => handlePermissionChange('can_send_visitor_notifications')}
                      />
                      <Label>Can send visitor notifications</Label>
                      <Description>Send SMS updates to visitors</Description>
                    </CheckboxField>
                  </div>
                </div>

                {/* Department Operations */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Department Operations (Service Providers)
                  </h5>
                  <div className="space-y-2 pl-2">
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_view_assigned_visitors || false}
                        onChange={() => handlePermissionChange('can_view_assigned_visitors')}
                      />
                      <Label>Can view assigned visitors</Label>
                      <Description>See visitors assigned to their department/person</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_mark_visitor_served || false}
                        onChange={() => handlePermissionChange('can_mark_visitor_served')}
                      />
                      <Label>Can mark visitor served</Label>
                      <Description>Complete service and mark visitor as served</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_transfer_visitors || false}
                        onChange={() => handlePermissionChange('can_transfer_visitors')}
                      />
                      <Label>Can transfer visitors</Label>
                      <Description>Transfer visitor to another department/staff</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_view_visitor_history || false}
                        onChange={() => handlePermissionChange('can_view_visitor_history')}
                      />
                      <Label>Can view visitor history</Label>
                      <Description>Access historical visitor records and journey logs</Description>
                    </CheckboxField>
                  </div>
                </div>

                {/* Analytics & Reports */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Analytics & Reports
                  </h5>
                  <div className="space-y-2 pl-2">
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_view_visitor_analytics || false}
                        onChange={() => handlePermissionChange('can_view_visitor_analytics')}
                      />
                      <Label>Can view visitor analytics</Label>
                      <Description>Access visitor statistics and metrics</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_export_visitor_reports || false}
                        onChange={() => handlePermissionChange('can_export_visitor_reports')}
                      />
                      <Label>Can export visitor reports</Label>
                      <Description>Generate and download visitor reports</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.can_generate_visitor_insights || false}
                        onChange={() => handlePermissionChange('can_generate_visitor_insights')}
                      />
                      <Label>Can generate visitor insights</Label>
                      <Description>Create advanced analytics and trends</Description>
                    </CheckboxField>
                  </div>
                </div>

                {/* Executive/VIP Roles */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Executive/VIP Roles (for CEO visitor auto-routing)
                  </h5>
                  <div className="space-y-2 pl-2">
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.is_chief_executive_officer || false}
                        onChange={() => handlePermissionChange('is_chief_executive_officer')}
                      />
                      <Label>Is Chief Executive Officer</Label>
                      <Description>CEO role - visitors requesting CEO are routed here</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.is_secretary || false}
                        onChange={() => handlePermissionChange('is_secretary')}
                      />
                      <Label>Is Secretary</Label>
                      <Description>VIP visitors are auto-routed to secretary first</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.is_executive_assistant || false}
                        onChange={() => handlePermissionChange('is_executive_assistant')}
                      />
                      <Label>Is Executive Assistant</Label>
                      <Description>VIP visitors are auto-routed to executive assistant</Description>
                    </CheckboxField>
                    <CheckboxField>
                      <Checkbox
                        checked={permissions.is_personal_assistant || false}
                        onChange={() => handlePermissionChange('is_personal_assistant')}
                      />
                      <Label>Is Personal Assistant</Label>
                      <Description>VIP visitors are auto-routed to personal assistant</Description>
                    </CheckboxField>
                  </div>
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
