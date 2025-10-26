import { apiRequest } from './api';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

/**
 * Execute a GraphQL query or mutation
 */
export async function graphql<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  console.log('GraphQL Request:', { query, variables });

  const response = await apiRequest<GraphQLResponse<T>>('/graphql', {
    method: 'POST',
    body: { query, variables },
  });

  console.log('GraphQL Response:', response);

  if (response.errors && response.errors.length > 0) {
    const errorMessage = response.errors.map(e => e.message).join(', ');
    console.error('GraphQL Errors:', response.errors);
    throw new Error(errorMessage);
  }

  if (!response.data) {
    throw new Error('No data returned from GraphQL query');
  }

  return response.data;
}

// ============================================================================
// RBAC Queries
// ============================================================================

export interface StaffRBACRole {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  workEmail: string;
  departmentId?: string;
  departmentName?: string;
  staffRoleType?: string;
  granularPermissions?: string; // JSON string
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  staffCount: number;
}

export interface GranularPermissions {
  // Organization & Settings Management
  can_update_org_settings: boolean;
  can_manage_database_config: boolean;
  can_view_org_info: boolean;
  can_update_org_info: boolean;

  // Staff Management (HR)
  can_register_staff: boolean;
  can_update_staff_info: boolean;
  can_deactivate_staff: boolean;
  can_view_staff_list: boolean;
  can_view_staff_details: boolean;
  can_assign_roles: boolean;
  can_manage_permissions: boolean;
  can_reset_staff_passwords: boolean;

  // Department Management
  can_create_departments: boolean;
  can_update_departments: boolean;
  can_delete_departments: boolean;
  can_view_departments: boolean;
  can_assign_department_managers: boolean;

  // Department-Scoped Operations (for Department Managers)
  can_view_department_staff: boolean;
  can_update_department_staff: boolean;
  can_approve_department_requests: boolean;

  // IT & System Administration
  can_manage_integrations: boolean;
  can_view_system_logs: boolean;
  can_manage_security_settings: boolean;
  can_configure_backups: boolean;
  can_manage_api_keys: boolean;

  // Audit & Compliance
  can_view_audit_logs: boolean;
  can_export_reports: boolean;
  can_view_compliance_data: boolean;

  // General Operations
  can_create: boolean;
  can_update: boolean;
  can_approve: boolean;
  can_delete: boolean;
  can_write: boolean;
  can_read: boolean;
  can_publish: boolean;
}

/**
 * Get staff member's RBAC role and permissions
 */
export async function getStaffRBACRole(staffId: string): Promise<StaffRBACRole | null> {
  const query = `
    query GetStaffRBACRole($staffId: String!) {
      staffRbacRole(staffId: $staffId) {
        id
        firstName
        lastName
        username
        workEmail
        departmentId
        departmentName
        staffRoleType
        granularPermissions
      }
    }
  `;

  const data = await graphql<{ staffRbacRole: StaffRBACRole | null }>(query, { staffId });
  return data.staffRbacRole;
}

/**
 * Get all departments for the organization
 */
export async function getDepartments(): Promise<Department[]> {
  const query = `
    query GetDepartments {
      departments {
        id
        name
        description
        isDefault
        isActive
        staffCount
      }
    }
  `;

  const data = await graphql<{ departments: Department[] }>(query);
  return data.departments;
}

/**
 * Get available RBAC role types
 */
export async function getRBACRoleTypes(): Promise<string[]> {
  const query = `
    query GetRBACRoleTypes {
      rbacRoleTypes
    }
  `;

  const data = await graphql<{ rbacRoleTypes: string[] }>(query);
  return data.rbacRoleTypes;
}

// ============================================================================
// RBAC Mutations
// ============================================================================

export interface UpdateStaffRBACInput {
  staffId: string;
  staffRoleType: string;
  departmentId?: string;
  granularPermissions: string; // JSON string
}

export interface UpdateStaffRBACPayload {
  success: boolean;
  message: string;
}

/**
 * Update staff member's RBAC role and permissions
 */
export async function updateStaffRBACRole(
  input: UpdateStaffRBACInput
): Promise<UpdateStaffRBACPayload> {
  const mutation = `
    mutation UpdateStaffRBACRole($input: UpdateStaffRBACInput!) {
      updateStaffRbacRole(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ updateStaffRbacRole: UpdateStaffRBACPayload }>(
    mutation,
    { input }
  );
  return data.updateStaffRbacRole;
}
