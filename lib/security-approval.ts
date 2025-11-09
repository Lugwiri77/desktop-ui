import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export interface SecurityStaffNomination {
  id: string;
  securityCompanyId: string;
  securityCompanyName: string;
  organizationId: string;
  organizationType: 'Business' | 'Institution';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  proposedBadgeNumber?: string;
  proposedWorkEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  nominatedAt: string;
  nominatedBy?: string;
  nominatedByName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  assignedRole?: 'security_manager' | 'team_lead' | 'security_guard';
  assignedGate?: 'main_gate' | 'side_gate' | 'back_gate' | 'parking_gate';
}

export interface SecurityStaff {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  workEmail: string;
  phoneNumber: string;
  badgeNumber: string;
  idNumber: string;
  securityRole: 'security_manager' | 'team_lead' | 'security_guard';
  assignedGate?: string;
  securityCompanyId: string;
  securityCompanyName: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  profilePicUrl?: string;
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
  status: 'active' | 'inactive' | 'suspended';
  staffCount: number;
  createdAt: string;
}

export interface SecurityIncident {
  id: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  incidentTime: string;
  gateLocation?: string;
  reportedById: string;
  reportedByName: string;
  relatedVisitorLogId?: string;
  relatedVisitorName?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolvedAt?: string;
  resolvedById?: string;
  resolvedByName?: string;
}

export type GateLocation = 'main_gate' | 'side_gate' | 'back_gate' | 'parking_gate';
export type SecurityRole = 'security_manager' | 'team_lead' | 'security_guard';

// ============================================================================
// Queries
// ============================================================================

/**
 * Get pending staff nominations
 */
export async function getPendingStaffNominations(): Promise<SecurityStaffNomination[]> {
  const query = `
    query GetPendingStaffNominations {
      pendingStaffNominations {
        id
        securityCompanyId
        securityCompanyName
        organizationId
        organizationType
        firstName
        lastName
        phoneNumber
        idNumber
        proposedBadgeNumber
        proposedWorkEmail
        status
        nominatedAt
        nominatedBy
        nominatedByName
      }
    }
  `;

  const data = await graphql<{ pendingStaffNominations: SecurityStaffNomination[] }>(query);
  return data.pendingStaffNominations;
}

/**
 * Get all staff nominations (with filters)
 */
export async function getStaffNominations(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<SecurityStaffNomination[]> {
  const query = `
    query GetStaffNominations($status: String) {
      staffNominations(status: $status) {
        id
        securityCompanyId
        securityCompanyName
        organizationId
        organizationType
        firstName
        lastName
        phoneNumber
        idNumber
        proposedBadgeNumber
        proposedWorkEmail
        status
        nominatedAt
        nominatedBy
        nominatedByName
        reviewedBy
        reviewedByName
        reviewedAt
        rejectionReason
        assignedRole
        assignedGate
      }
    }
  `;

  const data = await graphql<{ staffNominations: SecurityStaffNomination[] }>(query, { status });
  return data.staffNominations;
}

/**
 * Get all security staff
 */
export async function getSecurityStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  companyId?: string;
  status?: 'active' | 'inactive' | 'suspended';
}): Promise<SecurityStaff[]> {
  const query = `
    query GetSecurityStaff($filters: SecurityStaffFilters) {
      securityStaff(filters: $filters) {
        id
        firstName
        lastName
        username
        workEmail
        phoneNumber
        badgeNumber
        idNumber
        securityRole
        assignedGate
        securityCompanyId
        securityCompanyName
        status
        createdAt
        profilePicUrl
      }
    }
  `;

  const data = await graphql<{ securityStaff: SecurityStaff[] }>(query, { filters });
  return data.securityStaff;
}

/**
 * Get security staff by ID
 */
export async function getSecurityStaffById(staffId: string): Promise<SecurityStaff> {
  const query = `
    query GetSecurityStaffById($staffId: String!) {
      securityStaffById(staffId: $staffId) {
        id
        firstName
        lastName
        username
        workEmail
        phoneNumber
        badgeNumber
        idNumber
        securityRole
        assignedGate
        securityCompanyId
        securityCompanyName
        status
        createdAt
        profilePicUrl
      }
    }
  `;

  const data = await graphql<{ securityStaffById: SecurityStaff }>(query, { staffId });
  return data.securityStaffById;
}

/**
 * Get all security companies
 */
export async function getSecurityCompanies(): Promise<SecurityCompany[]> {
  const query = `
    query GetSecurityCompanies {
      securityCompanies {
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
        createdAt
      }
    }
  `;

  const data = await graphql<{ securityCompanies: SecurityCompany[] }>(query);
  return data.securityCompanies;
}

/**
 * Get security incidents
 */
export async function getSecurityIncidents(filters?: {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  startDate?: string;
  endDate?: string;
}): Promise<SecurityIncident[]> {
  const query = `
    query GetSecurityIncidents($filters: SecurityIncidentFilters) {
      securityIncidents(filters: $filters) {
        id
        incidentType
        severity
        description
        incidentTime
        gateLocation
        reportedById
        reportedByName
        relatedVisitorLogId
        relatedVisitorName
        status
        resolution
        resolvedAt
        resolvedById
        resolvedByName
      }
    }
  `;

  const data = await graphql<{ securityIncidents: SecurityIncident[] }>(query, { filters });
  return data.securityIncidents;
}

// ============================================================================
// Mutations
// ============================================================================

export interface ApproveStaffNominationInput {
  nominationId: string;
  assignedRole: SecurityRole;
  assignedGate: GateLocation;
  badgeNumber?: string;
}

/**
 * Approve staff nomination (assigns role and creates account)
 */
export async function approveStaffNomination(
  input: ApproveStaffNominationInput
): Promise<{ success: boolean; message: string; staffId?: string }> {
  const mutation = `
    mutation ApproveStaffNomination($input: ApproveStaffNominationInput!) {
      approveStaffNomination(input: $input) {
        success
        message
        staffId
      }
    }
  `;

  const data = await graphql<{
    approveStaffNomination: { success: boolean; message: string; staffId?: string };
  }>(mutation, { input });
  return data.approveStaffNomination;
}

export interface RejectStaffNominationInput {
  nominationId: string;
  rejectionReason: string;
}

/**
 * Reject staff nomination
 */
export async function rejectStaffNomination(
  input: RejectStaffNominationInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation RejectStaffNomination($input: RejectStaffNominationInput!) {
      rejectStaffNomination(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    rejectStaffNomination: { success: boolean; message: string };
  }>(mutation, { input });
  return data.rejectStaffNomination;
}

export interface BulkApproveNominationsInput {
  nominations: Array<{
    nominationId: string;
    assignedRole: SecurityRole;
    assignedGate: GateLocation;
    badgeNumber?: string;
  }>;
}

/**
 * Bulk approve staff nominations
 */
export async function bulkApproveNominations(
  input: BulkApproveNominationsInput
): Promise<{
  success: boolean;
  message: string;
  approved: number;
  failed: number;
  errors?: string[];
}> {
  const mutation = `
    mutation BulkApproveNominations($input: BulkApproveNominationsInput!) {
      bulkApproveNominations(input: $input) {
        success
        message
        approved
        failed
        errors
      }
    }
  `;

  const data = await graphql<{
    bulkApproveNominations: {
      success: boolean;
      message: string;
      approved: number;
      failed: number;
      errors?: string[];
    };
  }>(mutation, { input });
  return data.bulkApproveNominations;
}

export interface UpdateSecurityStaffInput {
  staffId: string;
  securityRole?: SecurityRole;
  assignedGate?: GateLocation;
  badgeNumber?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Update security staff details
 */
export async function updateSecurityStaff(
  input: UpdateSecurityStaffInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateSecurityStaff($input: UpdateSecurityStaffInput!) {
      updateSecurityStaff(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateSecurityStaff: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateSecurityStaff;
}

/**
 * Deactivate security staff
 */
export async function deactivateSecurityStaff(
  staffId: string
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation DeactivateSecurityStaff($staffId: String!) {
      deactivateSecurityStaff(staffId: $staffId) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    deactivateSecurityStaff: { success: boolean; message: string };
  }>(mutation, { staffId });
  return data.deactivateSecurityStaff;
}

export interface ResolveIncidentInput {
  incidentId: string;
  resolution: string;
  status: 'resolved' | 'closed';
}

/**
 * Resolve security incident
 */
export async function resolveSecurityIncident(
  input: ResolveIncidentInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation ResolveSecurityIncident($input: ResolveIncidentInput!) {
      resolveSecurityIncident(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    resolveSecurityIncident: { success: boolean; message: string };
  }>(mutation, { input });
  return data.resolveSecurityIncident;
}

export interface UpdateSecurityCompanyInput {
  companyId: string;
  contractEndDate?: string;
  status?: 'active' | 'inactive' | 'suspended';
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Update security company details
 */
export async function updateSecurityCompany(
  input: UpdateSecurityCompanyInput
): Promise<{ success: boolean; message: string }> {
  const mutation = `
    mutation UpdateSecurityCompany($input: UpdateSecurityCompanyInput!) {
      updateSecurityCompany(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{
    updateSecurityCompany: { success: boolean; message: string };
  }>(mutation, { input });
  return data.updateSecurityCompany;
}

/**
 * Register new security staff manually
 */
export interface RegisterSecurityStaffInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  workEmail: string;
  badgeNumber: string;
  securityCompanyId: string;
  securityRole: SecurityRole;
  assignedGate: GateLocation;
}

export async function registerSecurityStaff(
  input: RegisterSecurityStaffInput
): Promise<{ success: boolean; message: string; staffId?: string }> {
  const mutation = `
    mutation RegisterSecurityStaff($input: RegisterSecurityStaffInput!) {
      registerSecurityStaff(input: $input) {
        success
        message
        staffId
      }
    }
  `;

  const data = await graphql<{
    registerSecurityStaff: { success: boolean; message: string; staffId?: string };
  }>(mutation, { input });
  return data.registerSecurityStaff;
}
