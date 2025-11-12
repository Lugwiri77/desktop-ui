/**
 * Security Department Manager API
 * Specialized API functions for department managers
 */

import { graphql } from './graphql';
import { SecurityRole, GateLocation, ExternalSecurityStaff, InternalSecurityStaff } from './security-api';

// ============================================================================
// Types
// ============================================================================

export interface SecurityGate {
  id: string;
  locationId: string;
  gateCode: string;
  gateName: string;
  gateType: GateLocation;
  description?: string;
  isActive: boolean;
  isMonitored: boolean;
  createdAt: string;
}

export interface OrganizationLocation {
  id: string;
  locationCode: string;
  locationName: string;
  locationType: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecurityDepartmentOverview {
  internalStaffCount: number;
  externalStaffCount: number;
  visitorsToday: number;
  activeIncidents: number;
  gateCoverage: GateCoverageStatus[];
  recentActivity: DepartmentActivity[];
  trends: {
    visitorsChange: number; // percentage
    incidentsChange: number;
    staffChange: number;
  };
}

export interface GateCoverageStatus {
  gate: GateLocation;
  gateName: string;
  covered: boolean;
  staffId?: string;
  staffName?: string;
  staffBadgeNumber?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

export interface DepartmentActivity {
  id: string;
  type: 'staff_registered' | 'shift_assigned' | 'incident_reported' | 'visitor_routed' | 'password_reset';
  description: string;
  timestamp: string;
  staffId?: string;
  staffName?: string;
  metadata?: Record<string, any>;
}

export interface DepartmentVisitor {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  purpose: string;
  destination?: string;
  departmentId?: string;
  departmentName?: string;
  status: 'checked_in' | 'checked_out' | 'pending' | 'served';
  checkInTime?: string;
  checkOutTime?: string;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  gateLocation?: GateLocation;
  profilePicUrl?: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  gateLocation?: GateLocation;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  attachments?: string[];
}

export interface RegisterExternalStaffWithPasswordInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber: string;
  idNumber: string;
  password: string; // Non-resetable password created by department manager
  personalEmail?: string;
  securityRole: SecurityRole;
  assignedGate?: GateLocation;
  badgeNumber?: string;
  securityCompanyId?: string;
  reportsTo?: string;
  profilePicUrl?: string;
  userPhotoUrl?: string;
  videoUrl?: string;
}

export interface ResetExternalStaffPasswordInput {
  staffId: string;
  newPassword: string;
  resetReason?: string;
}

// ============================================================================
// Department Overview Queries
// ============================================================================

export async function getSecurityDepartmentOverview(): Promise<SecurityDepartmentOverview> {
  const query = `
    query GetSecurityDepartmentOverview {
      securityDepartmentOverview {
        internalStaffCount
        externalStaffCount
        visitorsToday
        activeIncidents
        gateCoverage {
          gate
          gateName
          covered
          staffId
          staffName
          staffBadgeNumber
          shiftStartTime
          shiftEndTime
        }
        recentActivity {
          id
          type
          description
          timestamp
          staffId
          staffName
          metadata
        }
        trends {
          visitorsChange
          incidentsChange
          staffChange
        }
      }
    }
  `;

  const data = await graphql<{ securityDepartmentOverview: SecurityDepartmentOverview }>(query);
  return data.securityDepartmentOverview;
}

// ============================================================================
// Department Staff Queries
// ============================================================================

export async function getDepartmentInternalStaff(filters?: {
  role?: SecurityRole;
  searchQuery?: string;
}): Promise<InternalSecurityStaff[]> {
  const query = `
    query GetDepartmentInternalStaff($filters: DepartmentStaffFilters) {
      departmentInternalStaff(filters: $filters) {
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

  const data = await graphql<{ departmentInternalStaff: InternalSecurityStaff[] }>(query, { filters });
  return data.departmentInternalStaff;
}

export async function getDepartmentExternalStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  companyId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  searchQuery?: string;
}): Promise<ExternalSecurityStaff[]> {
  const query = `
    query GetSecurityDepartmentExternalStaff {
      securityDepartmentExternalStaff {
        id
        firstName
        lastName
        workEmail
        phoneNumber
        idNumber
        badgeNumber
        securityRole
        assignedGate
        isActive
        organizationId
        organizationType
      }
    }
  `;

  const data = await graphql<{ securityDepartmentExternalStaff: ExternalSecurityStaff[] }>(query);
  return data.securityDepartmentExternalStaff;
}

// ============================================================================
// Department Visitors
// ============================================================================

export async function getDepartmentVisitors(filters: {
  startDate?: string;
  endDate?: string;
  status?: 'checked_in' | 'checked_out' | 'pending' | 'served';
  gate?: GateLocation;
  searchQuery?: string;
}): Promise<DepartmentVisitor[]> {
  const query = `
    query GetDepartmentVisitors($filters: DepartmentVisitorFilters!) {
      departmentVisitors(filters: $filters) {
        id
        firstName
        lastName
        phoneNumber
        idNumber
        purpose
        destination
        departmentId
        departmentName
        status
        checkInTime
        checkOutTime
        assignedToStaffId
        assignedToStaffName
        gateLocation
        profilePicUrl
      }
    }
  `;

  const data = await graphql<{ departmentVisitors: DepartmentVisitor[] }>(query, { filters });
  return data.departmentVisitors;
}

export async function assignVisitorToStaff(input: {
  visitorId: string;
  staffId: string;
}): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation AssignVisitorToStaff($input: AssignVisitorInput!) {
      assignVisitorToStaff(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ assignVisitorToStaff: { success: boolean; message: string } }>(
    mutation,
    { input }
  );
  return data.assignVisitorToStaff;
}

export async function markVisitorServed(
  visitorId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation MarkVisitorServed($visitorId: String!, $notes: String) {
      markVisitorServed(visitorId: $visitorId, notes: $notes) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ markVisitorServed: { success: boolean; message: string } }>(
    mutation,
    { visitorId, notes }
  );
  return data.markVisitorServed;
}

// ============================================================================
// Incidents
// ============================================================================

export async function getSecurityIncidents(filters?: {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  gate?: GateLocation;
  startDate?: string;
  endDate?: string;
}): Promise<SecurityIncident[]> {
  const query = `
    query GetSecurityIncidents($filters: SecurityIncidentFilters) {
      securityIncidents(filters: $filters) {
        id
        title
        description
        severity
        status
        gateLocation
        reportedBy
        reportedByName
        reportedAt
        resolvedAt
        resolutionNotes
        attachments
      }
    }
  `;

  const data = await graphql<{ securityIncidents: SecurityIncident[] }>(query, { filters });
  return data.securityIncidents;
}

export async function resolveIncident(input: {
  incidentId: string;
  resolutionNotes: string;
}): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation ResolveIncident($input: ResolveIncidentInput!) {
      resolveIncident(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ resolveIncident: { success: boolean; message: string } }>(
    mutation,
    { input }
  );
  return data.resolveIncident;
}

// ============================================================================
// Password Management (Department Manager Only)
// ============================================================================

/**
 * Register external staff with non-resetable password
 * CRITICAL: Password created by department manager cannot be reset by staff member
 */
export async function registerExternalStaffByDepartmentManager(
  input: RegisterExternalStaffWithPasswordInput
): Promise<{ success: boolean; message: string; staffId?: string }> {
  const mutation = `
    mutation RegisterExternalStaffWithPassword($input: RegisterExternalStaffWithPasswordInput!) {
      registerExternalStaffWithPassword(input: $input) {
        success
        message
        staffId
      }
    }
  `;

  const data = await graphql<{
    registerExternalStaffWithPassword: { success: boolean; message: string; staffId?: string };
  }>(mutation, { input });
  return data.registerExternalStaffWithPassword;
}

/**
 * Reset password for external staff (department manager or admin only)
 * External staff cannot reset their own passwords
 */
export async function resetExternalStaffPassword(
  input: ResetExternalStaffPasswordInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation ResetExternalStaffPassword($input: ResetExternalStaffPasswordInput!) {
      resetExternalStaffPassword(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    resetExternalStaffPassword: { success: boolean; message: string };
  }>(mutation, { input });
  return data.resetExternalStaffPassword;
}

// ============================================================================
// Shift Management
// ============================================================================

export interface ShiftAssignment {
  id: string;
  staffId: string;
  companyId: string;
  gateLocation: GateLocation;
  shiftStart: string;
  shiftEnd: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  requiresHandover: boolean;
  handoverCompleted: boolean;
  notes?: string;
  organizationId: string;
  organizationType: string;
  createdAt: string;
  updatedAt: string;
}

export async function getShiftAssignments(params?: {
  staffId?: string;
  gateLocation?: GateLocation;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<ShiftAssignment[]> {
  const query = `
    query GetShiftAssignments(
      $staffId: ID
      $gateLocation: GateLocation
      $status: ShiftStatus
      $startDate: NaiveDate
      $endDate: NaiveDate
      $limit: Int
      $offset: Int
    ) {
      getShiftAssignments(
        staffId: $staffId
        gateLocation: $gateLocation
        status: $status
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      ) {
        id
        staffId
        companyId
        gateLocation
        shiftStart
        shiftEnd
        actualCheckIn
        actualCheckOut
        status
        requiresHandover
        handoverCompleted
        notes
        organizationId
        organizationType
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ getShiftAssignments: ShiftAssignment[] }>(query, params || {});
  return data.getShiftAssignments;
}

// ============================================================================
// Gate Assignment
// ============================================================================

export async function assignGateToExternalStaff(input: {
  staffId: string;
  gateLocation: GateLocation;
}): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation AssignGateToExternalStaff($input: AssignGateInput!) {
      assignGateToExternalStaff(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    assignGateToExternalStaff: { success: boolean; message: string };
  }>(mutation, { input });
  return data.assignGateToExternalStaff;
}

// ============================================================================
// Staff Status Management
// ============================================================================

export async function deactivateExternalStaff(
  staffId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation DeactivateExternalStaff($staffId: String!, $reason: String) {
      deactivateExternalStaff(staffId: $staffId, reason: $reason) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    deactivateExternalStaff: { success: boolean; message: string };
  }>(mutation, { staffId, reason });
  return data.deactivateExternalStaff;
}

export async function reactivateExternalStaff(
  staffId: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation ReactivateExternalStaff($staffId: String!) {
      reactivateExternalStaff(staffId: $staffId) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    reactivateExternalStaff: { success: boolean; message: string };
  }>(mutation, { staffId });
  return data.reactivateExternalStaff;
}

// ============================================================================
// Reports & Analytics
// ============================================================================

export interface DepartmentAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  visitorStats: {
    total: number;
    checkIns: number;
    checkOuts: number;
    averageDuration: number;
    peakHours: Array<{ hour: number; count: number }>;
  };
  staffPerformance: {
    shiftsCompleted: number;
    shiftsScheduled: number;
    onTimeRate: number;
    incidentsReported: number;
  };
  gateCoverage: {
    totalShifts: number;
    coveredShifts: number;
    gapsDetected: number;
    coverageRate: number;
  };
  incidentAnalysis: {
    total: number;
    bySecurityIncidentverity: Record<string, number>;
    averageResolutionTime: number;
    resolvedCount: number;
  };
}

export async function getDepartmentAnalytics(
  period: 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string
): Promise<DepartmentAnalytics> {
  const query = `
    query GetDepartmentAnalytics($period: String!, $startDate: String, $endDate: String) {
      departmentAnalytics(period: $period, startDate: $startDate, endDate: $endDate) {
        period
        visitorStats {
          total
          checkIns
          checkOuts
          averageDuration
          peakHours {
            hour
            count
          }
        }
        staffPerformance {
          shiftsCompleted
          shiftsScheduled
          onTimeRate
          incidentsReported
        }
        gateCoverage {
          totalShifts
          coveredShifts
          gapsDetected
          coverageRate
        }
        incidentAnalysis {
          total
          bySeverity
          averageResolutionTime
          resolvedCount
        }
      }
    }
  `;

  const data = await graphql<{ departmentAnalytics: DepartmentAnalytics }>(
    query,
    { period, startDate, endDate }
  );
  return data.departmentAnalytics;
}

export async function exportDepartmentReport(input: {
  reportType: 'visitors' | 'staff_performance' | 'gate_coverage' | 'incidents';
  format: 'pdf' | 'csv' | 'excel';
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
  const mutation = `
    mutation ExportDepartmentReport($input: ExportReportInput!) {
      exportDepartmentReport(input: $input) {
        success
        downloadUrl
        message
      }
    }
  `;

  const data = await graphql<{
    exportDepartmentReport: { success: boolean; downloadUrl?: string; message: string };
  }>(mutation, { input });
  return data.exportDepartmentReport;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatGateLocation(gate: GateLocation): string {
  return gate.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getIncidentSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  };
  return colors[severity] || 'zinc';
}

export function getIncidentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'red',
    investigating: 'yellow',
    resolved: 'green',
    closed: 'zinc',
  };
  return colors[status] || 'zinc';
}

export function getVisitorStatusColor(status: string): string {
  const colors: Record<string, string> = {
    checked_in: 'green',
    checked_out: 'zinc',
    pending: 'yellow',
    served: 'blue',
  };
  return colors[status] || 'zinc';
}

// ============================================================================
// Gate Management Functions
// ============================================================================

/**
 * Fetch all gates for the organization
 */
export async function getOrganizationGates(): Promise<SecurityGate[]> {
  const query = `
    query GetOrganizationGates {
      organizationGates {
        id
        locationId
        gateCode
        gateName
        gateType
        description
        isActive
        isMonitored
        createdAt
      }
    }
  `;

  const data = await graphql<{ organizationGates: SecurityGate[] }>(query);
  return data.organizationGates;
}

/**
 * Fetch all locations for the organization
 */
export async function getOrganizationLocations(): Promise<OrganizationLocation[]> {
  const query = `
    query GetOrganizationLocations {
      organizationLocations {
        id
        locationCode
        locationName
        locationType
        addressLine1
        city
        country
        phoneNumber
        isActive
        createdAt
      }
    }
  `;

  const data = await graphql<{ organizationLocations: OrganizationLocation[] }>(query);
  return data.organizationLocations;
}

/**
 * Create a new location
 */
export async function createLocation(input: {
  locationCode: string;
  locationName: string;
  locationType: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
}): Promise<OrganizationLocation> {
  const mutation = `
    mutation CreateLocation($input: CreateLocationInput!) {
      createLocation(input: $input) {
        id
        locationCode
        locationName
        locationType
        addressLine1
        city
        country
        phoneNumber
        isActive
        createdAt
      }
    }
  `;

  const data = await graphql<{ createLocation: OrganizationLocation }>(mutation, { input });
  return data.createLocation;
}

/**
 * Create a new gate
 */
export async function createGate(input: {
  locationId: string;
  gateCode: string;
  gateName: string;
  gateType: GateLocation;
  description?: string;
  isMonitored?: boolean;
}): Promise<SecurityGate> {
  const mutation = `
    mutation CreateGate($input: CreateGateInput!) {
      createGate(input: $input) {
        id
        locationId
        gateCode
        gateName
        gateType
        description
        isActive
        isMonitored
        createdAt
      }
    }
  `;

  const data = await graphql<{ createGate: SecurityGate }>(mutation, { input });
  return data.createGate;
}
