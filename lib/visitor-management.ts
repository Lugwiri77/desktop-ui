import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export type VisitorStatus =
  | 'checked_in'
  | 'pending_routing'
  | 'routed'
  | 'in_service'
  | 'transferred'
  | 'completed'
  | 'checked_out';

export type VisitorType =
  | 'personal'
  | 'business_staff'
  | 'institution_staff'
  | 'walk_in';

export interface VisitorLog {
  id: string;
  visitorFullName: string;
  visitorPhoneNumber: string;
  visitorEmail?: string;
  visitorType: VisitorType;
  entryTime: string;
  actualExitTime?: string;
  status: VisitorStatus;
  purposeOfVisit?: string;
  destinationDepartment?: {
    id: string;
    name: string;
  };
  destinationStaff?: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
  };
  destinationOfficeLocation?: string;
  isAuthorized: boolean;
  otpVerified: boolean;
  entryNotes?: string;
  exitNotes?: string;
}

export interface VisitorJourneyEntry {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  timestamp: string;
  performedByStaff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  notes?: string;
}

export interface VisitorStats {
  checkedIn: number;
  pendingRouting: number;
  routed: number;
  inService: number;
  completedToday: number;
  checkedOutToday: number;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all active visitors (not checked out yet)
 */
export async function getActiveVisitors(status?: VisitorStatus): Promise<VisitorLog[]> {
  const query = `
    query GetActiveVisitors($status: VisitorStatus) {
      activeVisitors(status: $status) {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorType
        entryTime
        status
        purposeOfVisit
        destinationDepartment {
          id
          name
        }
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
        destinationOfficeLocation
        isAuthorized
        otpVerified
      }
    }
  `;

  const data = await graphql<{ activeVisitors: VisitorLog[] }>(query, { status });
  return data.activeVisitors;
}

/**
 * Get visitors assigned to current staff member
 */
export async function getMyAssignedVisitors(): Promise<VisitorLog[]> {
  const query = `
    query GetMyAssignedVisitors {
      myAssignedVisitors {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorType
        entryTime
        status
        purposeOfVisit
        destinationDepartment {
          id
          name
        }
        destinationOfficeLocation
        isAuthorized
        otpVerified
        entryNotes
      }
    }
  `;

  const data = await graphql<{ myAssignedVisitors: VisitorLog[] }>(query);
  return data.myAssignedVisitors;
}

/**
 * Get visitors for a specific department
 */
export async function getDepartmentVisitors(departmentId: string): Promise<VisitorLog[]> {
  const query = `
    query GetDepartmentVisitors($departmentId: String!) {
      departmentVisitors(departmentId: $departmentId) {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorType
        entryTime
        actualExitTime
        status
        purposeOfVisit
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
        destinationOfficeLocation
        isAuthorized
        otpVerified
      }
    }
  `;

  const data = await graphql<{ departmentVisitors: VisitorLog[] }>(query, { departmentId });
  return data.departmentVisitors;
}

/**
 * Get a single visitor log by ID
 */
export async function getVisitorLog(id: string): Promise<VisitorLog | null> {
  const query = `
    query GetVisitorLog($id: String!) {
      visitorLog(id: $id) {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorType
        entryTime
        actualExitTime
        status
        purposeOfVisit
        destinationDepartment {
          id
          name
        }
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
        destinationOfficeLocation
        isAuthorized
        otpVerified
        entryNotes
        exitNotes
      }
    }
  `;

  const data = await graphql<{ visitorLog: VisitorLog | null }>(query, { id });
  return data.visitorLog;
}

/**
 * Get visitor journey (status change history)
 */
export async function getVisitorJourney(visitorLogId: string): Promise<VisitorJourneyEntry[]> {
  const query = `
    query GetVisitorJourney($visitorLogId: String!) {
      visitorJourney(visitorLogId: $visitorLogId) {
        id
        action
        fromStatus
        toStatus
        timestamp
        performedByStaff {
          id
          firstName
          lastName
        }
        notes
      }
    }
  `;

  const data = await graphql<{ visitorJourney: VisitorJourneyEntry[] }>(query, { visitorLogId });
  return data.visitorJourney;
}

/**
 * Get visitor statistics
 */
export async function getVisitorStats(): Promise<VisitorStats> {
  const query = `
    query GetVisitorStats {
      visitorStats {
        checkedIn
        pendingRouting
        routed
        inService
        completedToday
        checkedOutToday
      }
    }
  `;

  const data = await graphql<{ visitorStats: VisitorStats }>(query);
  return data.visitorStats;
}

// ============================================================================
// Mutations
// ============================================================================

export interface ScanEntryInput {
  qrData: string;
  entryNotes?: string;
}

export interface RouteVisitorInput {
  visitorLogId: string;
  destinationDepartmentId?: string;
  destinationStaffId?: string;
  destinationOfficeLocation?: string;
  purposeOfVisit: string;
}

export interface TransferVisitorInput {
  visitorLogId: string;
  toDepartmentId?: string;
  toStaffId?: string;
  notes: string;
}

/**
 * Scan visitor entry at security gate
 */
export async function scanVisitorEntry(input: ScanEntryInput): Promise<VisitorLog> {
  const mutation = `
    mutation ScanVisitorEntry($input: ScanEntryInput!) {
      scanVisitorEntry(input: $input) {
        id
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorType
        entryTime
        status
        isAuthorized
        otpVerified
      }
    }
  `;

  const data = await graphql<{ scanVisitorEntry: VisitorLog }>(mutation, { input });
  return data.scanVisitorEntry;
}

/**
 * Route visitor to destination (Customer Care)
 */
export async function routeVisitor(input: RouteVisitorInput): Promise<VisitorLog> {
  const mutation = `
    mutation RouteVisitor($input: RouteVisitorInput!) {
      routeVisitor(input: $input) {
        id
        status
        purposeOfVisit
        destinationDepartment {
          id
          name
        }
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
        destinationOfficeLocation
      }
    }
  `;

  const data = await graphql<{ routeVisitor: VisitorLog }>(mutation, { input });
  return data.routeVisitor;
}

/**
 * Start service (Department Staff)
 */
export async function startService(visitorLogId: string): Promise<VisitorLog> {
  const mutation = `
    mutation StartService($visitorLogId: String!) {
      startService(visitorLogId: $visitorLogId) {
        id
        status
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
      }
    }
  `;

  const data = await graphql<{ startService: VisitorLog }>(mutation, { visitorLogId });
  return data.startService;
}

/**
 * Complete service (Department Staff)
 */
export async function completeService(visitorLogId: string, notes?: string): Promise<VisitorLog> {
  const mutation = `
    mutation CompleteService($visitorLogId: String!, $notes: String) {
      completeService(visitorLogId: $visitorLogId, notes: $notes) {
        id
        status
      }
    }
  `;

  const data = await graphql<{ completeService: VisitorLog }>(mutation, { visitorLogId, notes });
  return data.completeService;
}

/**
 * Transfer visitor to another department/staff
 */
export async function transferVisitor(input: TransferVisitorInput): Promise<VisitorLog> {
  const mutation = `
    mutation TransferVisitor($input: TransferVisitorInput!) {
      transferVisitor(input: $input) {
        id
        status
        destinationDepartment {
          id
          name
        }
        destinationStaff {
          id
          firstName
          lastName
          workEmail
        }
      }
    }
  `;

  const data = await graphql<{ transferVisitor: VisitorLog }>(mutation, { input });
  return data.transferVisitor;
}

/**
 * Scan visitor exit at security gate
 */
export async function scanVisitorExit(visitorLogId: string, exitNotes?: string): Promise<VisitorLog> {
  const mutation = `
    mutation ScanVisitorExit($visitorLogId: String!, $exitNotes: String) {
      scanVisitorExit(visitorLogId: $visitorLogId, exitNotes: $exitNotes) {
        id
        status
        actualExitTime
      }
    }
  `;

  const data = await graphql<{ scanVisitorExit: VisitorLog }>(mutation, { visitorLogId, exitNotes });
  return data.scanVisitorExit;
}

/**
 * Verify visitor OTP
 */
export async function verifyVisitorOtp(visitorLogId: string, otpCode: string): Promise<boolean> {
  const mutation = `
    mutation VerifyVisitorOtp($visitorLogId: String!, $otpCode: String!) {
      verifyVisitorOtp(visitorLogId: $visitorLogId, otpCode: $otpCode)
    }
  `;

  const data = await graphql<{ verifyVisitorOtp: boolean }>(mutation, { visitorLogId, otpCode });
  return data.verifyVisitorOtp;
}
