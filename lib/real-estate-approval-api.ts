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

// Backend response structure (matches GraphQL schema)
export interface TenantApprovalRequestBackend {
  id: string;
  visitorFullName: string;
  visitorPhone: string;
  purposeOfVisit?: string;
  approvalStatus: ApprovalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  otpExpiresAt: string;
  visitorLogId?: string;
  tenantId: string;
}

// UI-friendly interface with all fields
export interface TenantApprovalRequest {
  id: string;
  visitorFullName: string;
  visitorName: string; // Alias for UI compatibility
  visitorPhone: string;
  purposeOfVisit?: string;
  approvalStatus: ApprovalStatus;
  otpCode?: string;
  approvedAt?: string;
  rejectedAt?: string;
  otpExpiresAt: string;
  expiresAt: string; // Alias for UI compatibility
  visitorLogId?: string;
  tenantId: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
  approvalMethod: ApprovalMethod;
  requiresOtp: boolean;
  requestedAt: string;
  visitorIdNumber?: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

/**
 * Transform backend response to UI-friendly format (synchronous, with placeholders)
 * Note: Backend only provides tenantId. Tenant details (name, phone, unit)
 * are shown as placeholders. Use transformApprovalRequestWithDetails for full data.
 */
function transformApprovalRequest(backend: TenantApprovalRequestBackend): TenantApprovalRequest {
  // Backend doesn't provide tenant details, only tenantId
  // These will need to be populated from a separate tenant lookup
  const tenantName = `Tenant ${backend.tenantId.substring(0, 8)}...`; // Placeholder
  const unitNumber = 'Loading...'; // Placeholder
  const tenantPhone = ''; // Placeholder

  // Default approval method for real estate (OTP via SMS)
  const approvalMethod: ApprovalMethod = 'sms';

  return {
    id: backend.id,
    visitorFullName: backend.visitorFullName,
    visitorName: backend.visitorFullName, // Alias for UI compatibility
    visitorPhone: backend.visitorPhone,
    purposeOfVisit: backend.purposeOfVisit,
    approvalStatus: backend.approvalStatus,
    otpCode: undefined, // Backend doesn't expose OTP code for security
    approvedAt: backend.approvedAt,
    rejectedAt: backend.rejectedAt,
    otpExpiresAt: backend.otpExpiresAt,
    expiresAt: backend.otpExpiresAt, // Alias for UI compatibility
    visitorLogId: backend.visitorLogId,
    tenantId: backend.tenantId,
    unitNumber,
    tenantName,
    tenantPhone,
    approvalMethod,
    requiresOtp: true, // Real estate approvals always require OTP
    requestedAt: backend.approvedAt || backend.rejectedAt || new Date().toISOString(), // Fallback
    visitorIdNumber: undefined, // Backend doesn't provide this
    approvalNotes: undefined, // Backend doesn't provide this
    rejectionReason: undefined, // Backend doesn't provide this
  };
}

/**
 * Transform backend response with full tenant and unit details (asynchronous)
 * Fetches tenant and unit information from the real estate API
 */
async function transformApprovalRequestWithDetails(backend: TenantApprovalRequestBackend): Promise<TenantApprovalRequest> {
  let tenantName = 'Unknown Tenant';
  let unitNumber = 'N/A';
  let tenantPhone = '';

  try {
    // Import getTenant and getUnit functions
    const { getTenant } = await import('./real-estate-api');

    // Fetch tenant details
    const tenant = await getTenant(backend.tenantId);
    tenantName = `${tenant.firstName} ${tenant.lastName}`.trim();
    tenantPhone = tenant.phoneNumber;

    // Fetch unit details if tenant has unitId
    if (tenant.unitId) {
      const { getUnit } = await import('./real-estate-api');
      const unit = await getUnit(tenant.unitId);
      unitNumber = unit.unitNumber;
    }
  } catch (error) {
    console.error('Failed to fetch tenant/unit details:', error);
    // Fall back to placeholder data if fetching fails
  }

  // Default approval method for real estate (OTP via SMS)
  const approvalMethod: ApprovalMethod = 'sms';

  return {
    id: backend.id,
    visitorFullName: backend.visitorFullName,
    visitorName: backend.visitorFullName,
    visitorPhone: backend.visitorPhone,
    purposeOfVisit: backend.purposeOfVisit,
    approvalStatus: backend.approvalStatus,
    otpCode: undefined,
    approvedAt: backend.approvedAt,
    rejectedAt: backend.rejectedAt,
    otpExpiresAt: backend.otpExpiresAt,
    expiresAt: backend.otpExpiresAt,
    visitorLogId: backend.visitorLogId,
    tenantId: backend.tenantId,
    unitNumber,
    tenantName,
    tenantPhone,
    approvalMethod,
    requiresOtp: true,
    requestedAt: backend.approvedAt || backend.rejectedAt || new Date().toISOString(),
    visitorIdNumber: undefined,
    approvalNotes: undefined,
    rejectionReason: undefined,
  };
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
        visitorFullName
        visitorPhone
        purposeOfVisit
        approvalStatus
        approvedAt
        rejectedAt
        otpExpiresAt
        visitorLogId
        tenantId
      }
    }
  `;

  const data = await graphql<{ tenantApprovalRequests: TenantApprovalRequestBackend[] }>(
    query,
    params
  );

  // Transform all approval requests with full tenant/unit details
  return Promise.all(data.tenantApprovalRequests.map(transformApprovalRequestWithDetails));
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
        visitorFullName
        visitorPhone
        purposeOfVisit
        approvalStatus
        approvedAt
        rejectedAt
        otpExpiresAt
        visitorLogId
        tenantId
      }
    }
  `;

  const data = await graphql<{ tenantApprovalRequest: TenantApprovalRequestBackend | null }>(
    query,
    { approvalId }
  );
  return data.tenantApprovalRequest ? transformApprovalRequestWithDetails(data.tenantApprovalRequest) : null;
}

// ============================================================================
// Mutations
// ============================================================================

export interface RequestTenantApprovalInput {
  visitorFullName: string; // Backend expects visitorFullName
  visitorPhone: string;
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

  const expiresAt = new Date(request.otpExpiresAt);
  const now = new Date();
  return expiresAt > now;
}

/**
 * Get time remaining until expiry
 * @param otpExpiresAt - The OTP expiration timestamp
 */
export function getTimeRemaining(otpExpiresAt: string): string {
  const expires = new Date(otpExpiresAt);
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
