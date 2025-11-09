import { graphql } from './graphql';

// ===========================
// TYPES
// ===========================

export type GateLocation = 'MAIN_GATE' | 'SIDE_GATE' | 'STAFF_ENTRANCE' | 'VIP_ENTRANCE' | 'PARKING_ENTRANCE' | 'BACK_ENTRANCE';
export type ShiftStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ShiftAssignment {
  id: string;
  staffId: string;
  companyId: string;
  gateLocation: GateLocation;
  shiftStart: string;
  shiftEnd: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  status: ShiftStatus;
  requiresHandover: boolean;
  handoverCompleted: boolean;
  notes?: string;
  organizationId: string;
  organizationType: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityGateStats {
  gateLocation: GateLocation;
  totalEntriesToday: number;
  totalExitsToday: number;
  currentVisitorsInside: number;
  peakTime?: string;
  lastActivity?: string;
  organizationId: string;
  organizationType: string;
}

export interface SecurityIncident {
  id: string;
  incidentType: string;
  severity: IncidentSeverity;
  description: string;
  location: string;
  reportedByStaffId: string;
  incidentTime: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedByStaffId?: string;
  resolutionNotes?: string;
  alertSent: boolean;
  organizationId: string;
  organizationType: string;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// API FUNCTIONS
// ===========================

/**
 * Get shift assignments with optional filtering
 */
export async function getShiftAssignments(params?: {
  staffId?: string;
  gateLocation?: GateLocation;
  status?: ShiftStatus;
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

/**
 * Get security gate statistics for dashboard
 */
export async function getSecurityGateStats(params?: {
  organizationId?: string;
  organizationType?: string;
  gateLocation?: GateLocation;
}): Promise<SecurityGateStats[]> {
  const query = `
    query SecurityGateStats(
      $organizationId: ID
      $organizationType: OrganizationType
      $gateLocation: GateLocation
    ) {
      securityGateStats(
        organizationId: $organizationId
        organizationType: $organizationType
        gateLocation: $gateLocation
      ) {
        gateLocation
        totalEntriesToday
        totalExitsToday
        currentVisitorsInside
        peakTime
        lastActivity
        organizationId
        organizationType
      }
    }
  `;

  const data = await graphql<{ securityGateStats: SecurityGateStats[] }>(query, params || {});
  return data.securityGateStats;
}

/**
 * Get security incidents with optional filtering
 */
export async function getIncidents(params?: {
  severity?: IncidentSeverity;
  resolved?: boolean;
  organizationId?: string;
  organizationType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<SecurityIncident[]> {
  const query = `
    query GetIncidents(
      $severity: IncidentSeverity
      $resolved: Boolean
      $organizationId: ID
      $organizationType: OrganizationType
      $startDate: NaiveDate
      $endDate: NaiveDate
      $limit: Int
      $offset: Int
    ) {
      getIncidents(
        severity: $severity
        resolved: $resolved
        organizationId: $organizationId
        organizationType: $organizationType
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      ) {
        id
        incidentType
        severity
        description
        location
        reportedByStaffId
        incidentTime
        resolved
        resolvedAt
        resolvedByStaffId
        resolutionNotes
        alertSent
        organizationId
        organizationType
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ getIncidents: SecurityIncident[] }>(query, params || {});
  return data.getIncidents;
}

/**
 * Helper function to format gate location for display
 */
export function formatGateLocation(gate: GateLocation): string {
  const mapping: Record<GateLocation, string> = {
    MAIN_GATE: 'Main Gate',
    SIDE_GATE: 'Side Gate',
    STAFF_ENTRANCE: 'Staff Entrance',
    VIP_ENTRANCE: 'VIP Entrance',
    PARKING_ENTRANCE: 'Parking Entrance',
    BACK_ENTRANCE: 'Back Entrance',
  };
  return mapping[gate] || gate;
}

/**
 * Helper function to format shift status for display
 */
export function formatShiftStatus(status: ShiftStatus): string {
  const mapping: Record<ShiftStatus, string> = {
    SCHEDULED: 'Scheduled',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    MISSED: 'Missed',
    CANCELLED: 'Cancelled',
  };
  return mapping[status] || status;
}

/**
 * Helper function to format incident severity for display
 */
export function formatIncidentSeverity(severity: IncidentSeverity): string {
  const mapping: Record<IncidentSeverity, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };
  return mapping[severity] || severity;
}

/**
 * Resolve a security incident
 */
export async function resolveIncident(
  incidentId: string,
  resolutionNotes: string
): Promise<SecurityIncident> {
  const mutation = `
    mutation ResolveIncident($incidentId: ID!, $resolutionNotes: String!) {
      resolveIncident(incidentId: $incidentId, resolutionNotes: $resolutionNotes) {
        id
        incidentType
        severity
        description
        location
        reportedByStaffId
        incidentTime
        resolved
        resolvedAt
        resolvedByStaffId
        resolutionNotes
        alertSent
        organizationId
        organizationType
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ resolveIncident: SecurityIncident }>(mutation, {
    incidentId,
    resolutionNotes,
  });
  return data.resolveIncident;
}
