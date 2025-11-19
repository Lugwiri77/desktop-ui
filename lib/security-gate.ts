import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export interface SecurityGateStats {
  gateLocation: string;
  totalEntriesToday: number;
  totalExitsToday: number;
  currentVisitorsInside: number;
  peakTime?: string;
  lastActivity?: string;
  organizationId: string;
  organizationType: string;
}

export interface VisitorActivity {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdNumber?: string;
  purpose: string;
  hostName?: string;
  gateLocation: string;
  entryTime: string;
  exitTime?: string;
  scannedByStaffId: string;
  organizationId: string;
  organizationType: string;
  notes?: string;
  createdAt: string;
}

export interface SecurityStaffInfo {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  securityRole: 'security_manager' | 'team_lead' | 'security_guard';
  assignedGate?: string;
  profilePicUrl?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get security gate statistics
 * Note: Returns array of stats per gate
 */
export async function getSecurityGateStats(): Promise<SecurityGateStats[]> {
  const query = `
    query GetSecurityGateStats {
      securityGateStats {
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

  const data = await graphql<{ securityGateStats: SecurityGateStats[] }>(query);
  return data.securityGateStats;
}

/**
 * Get recent visitor activity at the gate
 */
export async function getRecentVisitorActivity(): Promise<VisitorActivity[]> {
  const query = `
    query GetRecentVisitorActivity {
      recentVisitorActivity {
        id
        visitorName
        visitorPhone
        visitorIdNumber
        purpose
        hostName
        entryTime
        exitTime
        activityType
        gateLocation
      }
    }
  `;

  const data = await graphql<{ recentVisitorActivity: VisitorActivity[] }>(query);
  return data.recentVisitorActivity;
}

/**
 * Search for a visitor by name or phone
 */
export async function searchVisitor(query: string) {
  const gqlQuery = `
    query SearchVisitor($query: String!) {
      searchVisitor(query: $query) {
        id
        visitorFullName
        visitorPhoneNumber
        status
        entryTime
        destinationDepartment {
          name
        }
      }
    }
  `;

  const data = await graphql<{ searchVisitor: any[] }>(gqlQuery, { query });
  return data.searchVisitor;
}

// ============================================================================
// Mutations
// ============================================================================

export interface ScanEntryInput {
  qrData: string;
  entryNotes?: string;
}

export interface ScanExitInput {
  visitorLogId: string;
  exitNotes?: string;
}

export interface VisitorScanResult {
  id: string;
  visitorFullName: string;
  visitorPhoneNumber: string;
  entryTime: string;
  status: string;
  otpVerified: boolean;
  otpRequired?: boolean;
}

export interface VerifyOtpInput {
  visitorLogId: string;
  otpCode: string;
}

/**
 * Scan visitor entry at security gate
 * Returns visitor info including OTP requirement status
 */
export async function scanVisitorEntry(input: ScanEntryInput): Promise<VisitorScanResult> {
  const mutation = `
    mutation ScanVisitorEntry($input: ScanEntryInput!) {
      scanVisitorEntry(input: $input) {
        id
        visitorFullName
        visitorPhoneNumber
        entryTime
        status
        otpVerified
      }
    }
  `;

  const data = await graphql<{ scanVisitorEntry: VisitorScanResult }>(mutation, { input });

  // Determine if OTP is required by checking if visitor is verified
  // If not verified after scan, it means OTP is required
  const result = data.scanVisitorEntry;
  result.otpRequired = !result.otpVerified && result.status === 'checked_in';

  return result;
}

/**
 * Verify visitor OTP code
 * Call this after scanning if OTP is required
 */
export async function verifyVisitorOtp(input: VerifyOtpInput): Promise<boolean> {
  const mutation = `
    mutation VerifyVisitorOtp($visitorLogId: String!, $otpCode: String!) {
      verifyVisitorOtp(visitorLogId: $visitorLogId, otpCode: $otpCode)
    }
  `;

  const data = await graphql<{ verifyVisitorOtp: boolean }>(mutation, {
    visitorLogId: input.visitorLogId,
    otpCode: input.otpCode,
  });

  return data.verifyVisitorOtp;
}

/**
 * Scan visitor exit at security gate
 */
export async function scanVisitorExit(input: ScanExitInput) {
  const mutation = `
    mutation ScanVisitorExit($visitorLogId: String!, $exitNotes: String) {
      scanVisitorExit(visitorLogId: $visitorLogId, exitNotes: $exitNotes) {
        id
        visitorFullName
        visitorPhoneNumber
        actualExitTime
        status
      }
    }
  `;

  const data = await graphql<{ scanVisitorExit: any }>(mutation, input);
  return data.scanVisitorExit;
}

/**
 * Report a security incident
 */
export interface ReportIncidentInput {
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  gateLocation?: string;
  relatedVisitorLogId?: string;
}

export async function reportIncident(input: ReportIncidentInput) {
  const mutation = `
    mutation ReportIncident($input: ReportIncidentInput!) {
      reportIncident(input: $input) {
        id
        incidentTime
        severity
      }
    }
  `;

  const data = await graphql<{ reportIncident: any }>(mutation, { input });
  return data.reportIncident;
}

/**
 * Get current shift information
 */
export async function getCurrentShift() {
  const query = `
    query GetCurrentShift {
      currentShift {
        id
        shiftStartTime
        shiftEndTime
        assignedGate
        actualCheckIn
        status
      }
    }
  `;

  const data = await graphql<{ currentShift: any }>(query);
  return data.currentShift;
}

/**
 * Check in for shift
 */
export async function checkInShift(shiftId: string) {
  const mutation = `
    mutation CheckInShift($shiftId: String!) {
      checkInShift(shiftId: $shiftId) {
        id
        actualCheckIn
        status
      }
    }
  `;

  const data = await graphql<{ checkInShift: any }>(mutation, { shiftId });
  return data.checkInShift;
}

/**
 * Check out from shift
 */
export async function checkOutShift(shiftId: string) {
  const mutation = `
    mutation CheckOutShift($shiftId: String!) {
      checkOutShift(shiftId: $shiftId) {
        id
        actualCheckOut
        status
      }
    }
  `;

  const data = await graphql<{ checkOutShift: any }>(mutation, { shiftId });
  return data.checkOutShift;
}

/**
 * Create shift handover notes
 */
export interface ShiftHandoverInput {
  visitorsCurrentlyInside: number;
  pendingExits: number;
  incidentsToNote?: string;
  equipmentStatus?: string;
  notes?: string;
}

export async function createShiftHandover(input: ShiftHandoverInput) {
  const mutation = `
    mutation CreateShiftHandover($input: ShiftHandoverInput!) {
      createShiftHandover(input: $input) {
        id
        handoverTime
      }
    }
  `;

  const data = await graphql<{ createShiftHandover: any }>(mutation, { input });
  return data.createShiftHandover;
}
