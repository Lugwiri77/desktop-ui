import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export type SecurityRole = 'security_manager' | 'team_lead' | 'security_guard';
export type GateLocation = 'main_gate' | 'side_gate' | 'back_gate' | 'parking_gate';
export type StaffStatus = 'active' | 'inactive' | 'suspended';
export type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'missed' | 'cancelled';
export type RegistrationSource = 'nominated' | 'manual';

export interface InternalSecurityStaff {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber: string;
  securityRole: SecurityRole;
  permissions: string[];
  department: string;
  badgeNumber?: string;
  assignedGate?: GateLocation;
  profilePicUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastActive?: string;
  shiftsWorked?: number;
  incidentsReported?: number;
}

export interface ExternalSecurityStaff {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber: string;
  idNumber: string;
  securityRole: SecurityRole;
  badgeNumber?: string;
  assignedGate?: GateLocation;
  securityCompanyId?: string;
  securityCompanyName?: string;
  organizationId: string;
  organizationType: 'business' | 'institution';
  isActive: boolean;
  source: RegistrationSource;
  profilePicUrl?: string;
  videoUrl?: string;
  createdAt: string;
  status: StaffStatus;
}

export interface SecurityCompany {
  id: string;
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  status: StaffStatus;
  staffCount: number;
  activeAssignments: number;
  createdAt: string;
  logoUrl?: string;
}

export interface ShiftAssignment {
  id: string;
  securityStaffId: string;
  staffName: string;
  staffBadgeNumber?: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  assignedGate: GateLocation;
  status: ShiftStatus;
  actualCheckIn?: string;
  actualCheckOut?: string;
  notes?: string;
  requiresHandover: boolean;
  handoverNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SecurityRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: SecurityPermission[];
  staffCount: number;
  isDefault: boolean;
  createdAt: string;
}

export interface SecurityPermission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | 'visitor_management'
  | 'staff_management'
  | 'incident_management'
  | 'reporting'
  | 'system_admin';

export interface StaffActivity {
  id: string;
  staffId: string;
  activityType: 'shift_start' | 'shift_end' | 'incident_report' | 'visitor_scan' | 'gate_assignment';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  staffId: string;
  shiftsCompleted: number;
  shiftsScheduled: number;
  onTimePercentage: number;
  incidentsReported: number;
  visitorsProcessed: number;
  averageResponseTime: number;
  lastShiftDate?: string;
  period: 'week' | 'month' | 'year';
}

// ============================================================================
// Internal Security Staff Queries
// ============================================================================

export async function getInternalSecurityStaff(filters?: {
  role?: SecurityRole;
  status?: StaffStatus;
  department?: string;
  searchQuery?: string;
}): Promise<InternalSecurityStaff[]> {
  const query = `
    query GetInternalSecurityStaff($filters: InternalSecurityStaffFilters) {
      internalSecurityStaff(filters: $filters) {
        id
        firstName
        lastName
        workEmail
        phoneNumber
        securityRole
        permissions
        department
        badgeNumber
        assignedGate
        profilePicUrl
        isActive
        createdAt
        lastActive
        shiftsWorked
        incidentsReported
      }
    }
  `;

  const data = await graphql<{ internalSecurityStaff: InternalSecurityStaff[] }>(query, { filters });
  return data.internalSecurityStaff;
}

export async function getInternalSecurityStaffById(staffId: string): Promise<InternalSecurityStaff> {
  const query = `
    query GetInternalSecurityStaffById($staffId: String!) {
      internalSecurityStaffById(staffId: $staffId) {
        id
        firstName
        lastName
        workEmail
        phoneNumber
        securityRole
        permissions
        department
        badgeNumber
        assignedGate
        profilePicUrl
        isActive
        createdAt
        lastActive
        shiftsWorked
        incidentsReported
      }
    }
  `;

  const data = await graphql<{ internalSecurityStaffById: InternalSecurityStaff }>(query, { staffId });
  return data.internalSecurityStaffById;
}

// ============================================================================
// External Security Staff Queries
// ============================================================================

export async function getExternalSecurityStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  companyId?: string;
  status?: StaffStatus;
  source?: RegistrationSource;
  searchQuery?: string;
}): Promise<ExternalSecurityStaff[]> {
  const query = `
    query GetExternalSecurityStaff($filters: ExternalSecurityStaffFilters) {
      externalSecurityStaff(filters: $filters) {
        id
        firstName
        lastName
        workEmail
        phoneNumber
        idNumber
        securityRole
        badgeNumber
        assignedGate
        securityCompanyId
        securityCompanyName
        organizationId
        organizationType
        isActive
        source
        profilePicUrl
        videoUrl
        createdAt
        status
      }
    }
  `;

  const data = await graphql<{ externalSecurityStaff: ExternalSecurityStaff[] }>(query, { filters });
  return data.externalSecurityStaff;
}

export async function getExternalSecurityStaffById(staffId: string): Promise<ExternalSecurityStaff> {
  const query = `
    query GetExternalSecurityStaffById($staffId: String!) {
      externalSecurityStaffById(staffId: $staffId) {
        id
        firstName
        lastName
        workEmail
        phoneNumber
        idNumber
        securityRole
        badgeNumber
        assignedGate
        securityCompanyId
        securityCompanyName
        organizationId
        organizationType
        isActive
        source
        profilePicUrl
        videoUrl
        createdAt
        status
      }
    }
  `;

  const data = await graphql<{ externalSecurityStaffById: ExternalSecurityStaff }>(query, { staffId });
  return data.externalSecurityStaffById;
}

// ============================================================================
// Security Companies
// ============================================================================

export async function getSecurityCompanies(filters?: {
  status?: StaffStatus;
  searchQuery?: string;
}): Promise<SecurityCompany[]> {
  const query = `
    query GetSecurityCompanies($filters: SecurityCompanyFilters) {
      securityCompanies(filters: $filters) {
        id
        companyName
        registrationNumber
        contactPerson
        contactEmail
        contactPhone
        contractStartDate
        contractEndDate
        status
        staffCount
        activeAssignments
        createdAt
        logoUrl
      }
    }
  `;

  const data = await graphql<{ securityCompanies: SecurityCompany[] }>(query, { filters });
  return data.securityCompanies;
}

export async function getSecurityCompanyById(companyId: string): Promise<SecurityCompany> {
  const query = `
    query GetSecurityCompanyById($companyId: String!) {
      securityCompanyById(companyId: $companyId) {
        id
        companyName
        registrationNumber
        contactPerson
        contactEmail
        contactPhone
        contractStartDate
        contractEndDate
        status
        staffCount
        activeAssignments
        createdAt
        logoUrl
      }
    }
  `;

  const data = await graphql<{ securityCompanyById: SecurityCompany }>(query, { companyId });
  return data.securityCompanyById;
}

// ============================================================================
// Shift Assignments
// ============================================================================

export async function getShiftAssignments(filters?: {
  staffId?: string;
  gate?: GateLocation;
  status?: ShiftStatus;
  startDate?: string;
  endDate?: string;
}): Promise<ShiftAssignment[]> {
  const query = `
    query GetShiftAssignments($filters: ShiftAssignmentFilters) {
      shiftAssignments(filters: $filters) {
        id
        securityStaffId
        staffName
        staffBadgeNumber
        shiftDate
        shiftStartTime
        shiftEndTime
        assignedGate
        status
        actualCheckIn
        actualCheckOut
        notes
        requiresHandover
        handoverNotes
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ shiftAssignments: ShiftAssignment[] }>(query, { filters });
  return data.shiftAssignments;
}

export async function getShiftAssignmentById(assignmentId: string): Promise<ShiftAssignment> {
  const query = `
    query GetShiftAssignmentById($assignmentId: String!) {
      shiftAssignmentById(assignmentId: $assignmentId) {
        id
        securityStaffId
        staffName
        staffBadgeNumber
        shiftDate
        shiftStartTime
        shiftEndTime
        assignedGate
        status
        actualCheckIn
        actualCheckOut
        notes
        requiresHandover
        handoverNotes
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ shiftAssignmentById: ShiftAssignment }>(query, { assignmentId });
  return data.shiftAssignmentById;
}

// ============================================================================
// Staff Activity & Performance
// ============================================================================

export async function getStaffActivity(staffId: string, limit?: number): Promise<StaffActivity[]> {
  const query = `
    query GetStaffActivity($staffId: String!, $limit: Int) {
      staffActivity(staffId: $staffId, limit: $limit) {
        id
        staffId
        activityType
        description
        timestamp
        metadata
      }
    }
  `;

  const data = await graphql<{ staffActivity: StaffActivity[] }>(query, { staffId, limit });
  return data.staffActivity;
}

export async function getPerformanceMetrics(
  staffId: string,
  period: 'week' | 'month' | 'year'
): Promise<PerformanceMetrics> {
  const query = `
    query GetPerformanceMetrics($staffId: String!, $period: String!) {
      performanceMetrics(staffId: $staffId, period: $period) {
        staffId
        shiftsCompleted
        shiftsScheduled
        onTimePercentage
        incidentsReported
        visitorsProcessed
        averageResponseTime
        lastShiftDate
        period
      }
    }
  `;

  const data = await graphql<{ performanceMetrics: PerformanceMetrics }>(query, { staffId, period });
  return data.performanceMetrics;
}

// ============================================================================
// Roles & Permissions
// ============================================================================

export async function getSecurityRoles(): Promise<SecurityRole[]> {
  const query = `
    query GetSecurityRoles {
      securityRoles {
        id
        name
        displayName
        description
        permissions {
          id
          name
          displayName
          description
          category
        }
        staffCount
        isDefault
        createdAt
      }
    }
  `;

  const data = await graphql<{ securityRoles: SecurityRole[] }>(query);
  return data.securityRoles;
}

export async function getAvailablePermissions(): Promise<SecurityPermission[]> {
  const query = `
    query GetAvailablePermissions {
      availablePermissions {
        id
        name
        displayName
        description
        category
      }
    }
  `;

  const data = await graphql<{ availablePermissions: SecurityPermission[] }>(query);
  return data.availablePermissions;
}

// ============================================================================
// Mutations - External Staff Registration
// ============================================================================

export interface RegisterExternalStaffInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber: string;
  idNumber: string;
  securityRole: SecurityRole;
  assignedGate?: GateLocation;
  badgeNumber?: string;
  securityCompanyId?: string;
  profilePicUrl?: string;
  videoUrl?: string;
}

export async function registerExternalStaff(
  input: RegisterExternalStaffInput
): Promise<{ success: boolean; message: string; staffId?: string }> {
  const mutation = `
    mutation RegisterExternalStaff($input: RegisterExternalStaffInput!) {
      registerExternalStaff(input: $input) {
        success
        message
        staffId
      }
    }
  `;

  const data = await graphql<{
    registerExternalStaff: { success: boolean; message: string; staffId?: string };
  }>(mutation, { input });
  return data.registerExternalStaff;
}

// ============================================================================
// Mutations - Shift Management
// ============================================================================

export interface AssignShiftInput {
  securityStaffId: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  assignedGate: GateLocation;
  requiresHandover: boolean;
  notes?: string;
}

export async function assignShift(
  input: AssignShiftInput
): Promise<{ success: boolean; message: string; assignmentId?: string }> {
  const mutation = `
    mutation AssignShift($input: AssignShiftInput!) {
      assignShift(input: $input) {
        success
        message
        assignmentId
      }
    }
  `;

  const data = await graphql<{
    assignShift: { success: boolean; message: string; assignmentId?: string };
  }>(mutation, { input });
  return data.assignShift;
}

export interface BulkAssignShiftsInput {
  assignments: AssignShiftInput[];
}

export async function bulkAssignShifts(
  input: BulkAssignShiftsInput
): Promise<{ success: boolean; message: string; successCount: number; failedCount: number; errors?: string[] }> {
  const mutation = `
    mutation BulkAssignShifts($input: BulkAssignShiftsInput!) {
      bulkAssignShifts(input: $input) {
        success
        message
        successCount
        failedCount
        errors
      }
    }
  `;

  const data = await graphql<{
    bulkAssignShifts: {
      success: boolean;
      message: string;
      successCount: number;
      failedCount: number;
      errors?: string[];
    };
  }>(mutation, { input });
  return data.bulkAssignShifts;
}

export interface UpdateShiftInput {
  assignmentId: string;
  shiftDate?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  assignedGate?: GateLocation;
  status?: ShiftStatus;
  notes?: string;
  handoverNotes?: string;
}

export async function updateShift(
  input: UpdateShiftInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateShift($input: UpdateShiftInput!) {
      updateShift(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateShift: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateShift;
}

export async function cancelShift(
  assignmentId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation CancelShift($assignmentId: String!, $reason: String) {
      cancelShift(assignmentId: $assignmentId, reason: $reason) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    cancelShift: { success: boolean; message: string };
  }>(mutation, { assignmentId, reason });
  return data.cancelShift;
}

// ============================================================================
// Mutations - Staff Management
// ============================================================================

export interface UpdateStaffRoleInput {
  staffId: string;
  securityRole: SecurityRole;
  permissions: string[];
}

export async function updateStaffRole(
  input: UpdateStaffRoleInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateStaffRole($input: UpdateStaffRoleInput!) {
      updateStaffRole(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateStaffRole: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateStaffRole;
}

export interface AssignGateInput {
  staffId: string;
  gate: GateLocation;
}

export async function assignGate(
  input: AssignGateInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation AssignGate($input: AssignGateInput!) {
      assignGate(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    assignGate: { success: boolean; message: string };
  }>(mutation, { input });
  return data.assignGate;
}

export interface UpdateStaffStatusInput {
  staffId: string;
  status: StaffStatus;
  reason?: string;
}

export async function updateStaffStatus(
  input: UpdateStaffStatusInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateStaffStatus($input: UpdateStaffStatusInput!) {
      updateStaffStatus(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateStaffStatus: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateStaffStatus;
}

// ============================================================================
// Mutations - Role Management
// ============================================================================

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

export async function createSecurityRole(
  input: CreateRoleInput
): Promise<{ success: boolean; message: string; roleId?: string }> {
  const mutation = `
    mutation CreateSecurityRole($input: CreateRoleInput!) {
      createSecurityRole(input: $input) {
        success
        message
        roleId
      }
    }
  `;

  const data = await graphql<{
    createSecurityRole: { success: boolean; message: string; roleId?: string };
  }>(mutation, { input });
  return data.createSecurityRole;
}

export interface UpdateRoleInput {
  roleId: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export async function updateSecurityRole(
  input: UpdateRoleInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateSecurityRole($input: UpdateRoleInput!) {
      updateSecurityRole(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateSecurityRole: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateSecurityRole;
}

export async function deleteSecurityRole(
  roleId: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation DeleteSecurityRole($roleId: String!) {
      deleteSecurityRole(roleId: $roleId) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    deleteSecurityRole: { success: boolean; message: string };
  }>(mutation, { roleId });
  return data.deleteSecurityRole;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatGateLocation(gate: GateLocation): string {
  return gate.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function formatSecurityRole(role: SecurityRole): string {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getGateColor(gate: GateLocation): string {
  const colors = {
    main_gate: 'blue',
    side_gate: 'green',
    back_gate: 'purple',
    parking_gate: 'orange',
  };
  return colors[gate] || 'zinc';
}

export function getRoleColor(role: SecurityRole): string {
  const colors = {
    security_manager: 'purple',
    team_lead: 'blue',
    security_guard: 'green',
  };
  return colors[role] || 'zinc';
}

export function getStatusColor(status: StaffStatus | ShiftStatus): string {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'zinc',
    suspended: 'red',
    scheduled: 'blue',
    completed: 'green',
    missed: 'red',
    cancelled: 'zinc',
  };
  return colors[status] || 'zinc';
}
