import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export type ApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type ApprovalMethod =
  | 'push_notification'
  | 'email'
  | 'sms'
  | 'phone_call';

export interface TenantApprovalRequest {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdNumber?: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
  purposeOfVisit?: string;
  approvalStatus: ApprovalStatus;
  approvalMethod: ApprovalMethod;
  requiresOtp: boolean;
  otpCode?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt: string;
  approvalNotes?: string;
  rejectionReason?: string;
  visitorLogId?: string;
}

export interface TenantApprovalHistory {
  id: string;
  action: 'requested' | 'approved' | 'rejected' | 'expired' | 'resent' | 'called' | 'overridden';
  performedBy?: string;
  performedByRole?: string;
  timestamp: string;
  notes?: string;
  method?: ApprovalMethod;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all tenant approval requests for real estate visitors
 * Filters by status and date range
 */
export async function getTenantApprovalRequests(params?: {
  status?: ApprovalStatus;
  startDate?: string;
  endDate?: string;
  unitNumber?: string;
}): Promise<TenantApprovalRequest[]> {
  const query = `
    query GetTenantApprovalRequests(
      $status: String
      $startDate: String
      $endDate: String
      $unitNumber: String
    ) {
      tenantApprovalRequests(
        status: $status
        startDate: $startDate
        endDate: $endDate
        unitNumber: $unitNumber
      ) {
        id
        visitorName
        visitorPhone
        visitorIdNumber
        unitNumber
        tenantName
        tenantPhone
        purposeOfVisit
        approvalStatus
        approvalMethod
        requiresOtp
        otpCode
        requestedAt
        approvedAt
        rejectedAt
        expiresAt
        approvalNotes
        rejectionReason
        visitorLogId
      }
    }
  `;

  const data = await graphql<{ tenantApprovalRequests: TenantApprovalRequest[] }>(
    query,
    params
  );
  return data.tenantApprovalRequests;
}

/**
 * Get approval history for a specific request
 */
export async function getApprovalHistory(approvalId: string): Promise<TenantApprovalHistory[]> {
  const query = `
    query GetApprovalHistory($approvalId: String!) {
      approvalHistory(approvalId: $approvalId) {
        id
        action
        performedBy
        performedByRole
        timestamp
        notes
        method
      }
    }
  `;

  const data = await graphql<{ approvalHistory: TenantApprovalHistory[] }>(
    query,
    { approvalId }
  );
  return data.approvalHistory;
}

/**
 * Get a single tenant approval request by ID
 */
export async function getTenantApprovalRequest(approvalId: string): Promise<TenantApprovalRequest | null> {
  const query = `
    query GetTenantApprovalRequest($approvalId: String!) {
      tenantApprovalRequest(approvalId: $approvalId) {
        id
        visitorName
        visitorPhone
        visitorIdNumber
        unitNumber
        tenantName
        tenantPhone
        purposeOfVisit
        approvalStatus
        approvalMethod
        requiresOtp
        otpCode
        requestedAt
        approvedAt
        rejectedAt
        expiresAt
        approvalNotes
        rejectionReason
        visitorLogId
      }
    }
  `;

  const data = await graphql<{ tenantApprovalRequest: TenantApprovalRequest | null }>(
    query,
    { approvalId }
  );
  return data.tenantApprovalRequest;
}

// ============================================================================
// Mutations
// ============================================================================

export interface RequestTenantApprovalInput {
  visitorName: string;
  visitorPhone: string;
  visitorIdNumber?: string;
  unitId: string;
  purposeOfVisit?: string;
  visitorLogId?: string;
}

export interface ResendApprovalInput {
  approvalId: string;
  method?: ApprovalMethod;
}

export interface ManualOverrideInput {
  approvalId: string;
  action: 'approve' | 'reject';
  reason: string;
  performedBy: string;
}

export interface TenantApprovalResponse {
  success: boolean;
  message: string;
  approvalId?: string;
}

/**
 * Request tenant approval for a visitor
 * Security staff initiates this after visitor checks in
 */
export async function requestTenantApproval(
  input: RequestTenantApprovalInput
): Promise<TenantApprovalResponse> {
  const mutation = `
    mutation RequestTenantApproval($input: RequestTenantApprovalInput!) {
      requestTenantApproval(input: $input) {
        success
        message
        approvalId
      }
    }
  `;

  const data = await graphql<{ requestTenantApproval: TenantApprovalResponse }>(
    mutation,
    { input }
  );
  return data.requestTenantApproval;
}

/**
 * Resend approval request to tenant
 * Used when tenant doesn't respond in time or requests resend
 */
export async function resendApprovalRequest(
  input: ResendApprovalInput
): Promise<TenantApprovalResponse> {
  const mutation = `
    mutation ResendApprovalRequest($input: ResendApprovalInput!) {
      resendApprovalRequest(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ resendApprovalRequest: TenantApprovalResponse }>(
    mutation,
    { input }
  );
  return data.resendApprovalRequest;
}

/**
 * Manual override - security staff forces approval/rejection
 * Used in emergency situations or when tenant cannot be reached
 */
export async function manualOverrideApproval(
  input: ManualOverrideInput
): Promise<TenantApprovalResponse> {
  const mutation = `
    mutation ManualOverrideApproval($input: ManualOverrideInput!) {
      manualOverrideApproval(input: $input) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ manualOverrideApproval: TenantApprovalResponse }>(
    mutation,
    { input }
  );
  return data.manualOverrideApproval;
}

/**
 * Cancel an approval request
 * Used when visitor leaves before getting approval
 */
export async function cancelApprovalRequest(approvalId: string): Promise<TenantApprovalResponse> {
  const mutation = `
    mutation CancelApprovalRequest($approvalId: String!) {
      cancelApprovalRequest(approvalId: $approvalId) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ cancelApprovalRequest: TenantApprovalResponse }>(
    mutation,
    { approvalId }
  );
  return data.cancelApprovalRequest;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get human-readable status text
 */
export function getStatusText(status: ApprovalStatus): string {
  switch (status) {
    case 'pending_approval':
      return 'Waiting for Tenant';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired (No Response)';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: ApprovalStatus): 'yellow' | 'green' | 'red' | 'zinc' {
  switch (status) {
    case 'pending_approval':
      return 'yellow';
    case 'approved':
      return 'green';
    case 'rejected':
    case 'expired':
      return 'red';
    case 'cancelled':
      return 'zinc';
    default:
      return 'zinc';
  }
}

/**
 * Get method icon name
 */
export function getMethodIcon(method: ApprovalMethod): string {
  switch (method) {
    case 'push_notification':
      return 'Smartphone';
    case 'email':
      return 'Mail';
    case 'sms':
      return 'MessageSquare';
    case 'phone_call':
      return 'Phone';
    default:
      return 'Bell';
  }
}

/**
 * Get method display text
 */
export function getMethodText(method: ApprovalMethod): string {
  switch (method) {
    case 'push_notification':
      return 'Mobile App';
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'phone_call':
      return 'Phone Call';
    default:
      return method;
  }
}

/**
 * Check if approval is still pending
 */
export function isApprovalPending(request: TenantApprovalRequest): boolean {
  if (request.approvalStatus !== 'pending_approval') {
    return false;
  }

  const expiresAt = new Date(request.expiresAt);
  const now = new Date();
  return expiresAt > now;
}

/**
 * Get time remaining until expiry
 */
export function getTimeRemaining(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
