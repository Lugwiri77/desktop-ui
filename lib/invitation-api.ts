/**
 * User Invitation GraphQL API
 *
 * Generic invitation system that works across all organization types:
 * - Real Estate: Invite tenants
 * - Education: Invite students/guardians
 * - Religious: Invite church members
 * - Business: Invite employees/customers
 *
 * Corresponds to backend mutations in backend/src/graphql/mutations/invitations.rs
 */

import { graphql } from './graphql';

// Re-export graphql for use in components
export { graphql };

// ============================================================================
// TYPES
// ============================================================================

export type InviteeType =
  | 'tenant'
  | 'student'
  | 'guardian'
  | 'church_member'
  | 'employee'
  | 'staff'
  | 'customer'
  | 'visitor'
  | 'other';

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'cancelled'
  | 'bounced';

export interface CreateInvitationInput {
  organizationType: string;
  organizationId: string;
  locationId?: string;
  locationType?: string;
  inviteeType: InviteeType;
  inviteeId: string;
  inviteeTableName: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviteePhone: string;
  inviteeSecondaryEmail?: string;
  inviteeSecondaryPhone?: string;
  sendEmail: boolean;
  sendSms: boolean;
  preferredLanguage?: string;
  customMessage?: string;
  customSubject?: string;
  validForDays?: number;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export interface InvitationResult {
  invitationId: string;
  invitationToken: string;
  tokenJti: string;
  registrationUrl: string;
  emailSent: boolean;
  smsSent: boolean;
  expiresAt: string;
}

export interface InvitationStats {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
  acceptanceRate: number;
}

export interface InvitationTokenClaims {
  invitationId: string;
  inviteeType: string;
  inviteeId: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviteePhone: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  exp: number;
  iat: number;
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create and send a new invitation
 */
export const CREATE_INVITATION = `
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      invitationId
      invitationToken
      tokenJti
      registrationUrl
      emailSent
      smsSent
      expiresAt
    }
  }
`;

/**
 * Resend an existing invitation with a new token
 */
export const RESEND_INVITATION = `
  mutation ResendInvitation($input: ResendInvitationInput!) {
    resendInvitation(input: $input) {
      invitationId
      invitationToken
      registrationUrl
      emailSent
      smsSent
      expiresAt
    }
  }
`;

/**
 * Cancel a pending invitation
 */
export const CANCEL_INVITATION = `
  mutation CancelInvitation($input: CancelInvitationInput!) {
    cancelInvitation(input: $input)
  }
`;

/**
 * Verify if an invitation token is valid
 */
export const VERIFY_INVITATION_TOKEN = `
  mutation VerifyInvitationToken($input: VerifyInvitationInput!) {
    verifyInvitationToken(input: $input) {
      invitationId
      inviteeType
      inviteeId
      inviteeName
      inviteeEmail
      inviteePhone
      organizationId
      organizationName
      organizationType
      exp
      iat
    }
  }
`;

/**
 * Get invitation statistics for an organization
 */
export const GET_INVITATION_STATS = `
  mutation GetInvitationStats(
    $organizationType: String!,
    $organizationId: ID!
  ) {
    getInvitationStats(
      organizationType: $organizationType,
      organizationId: $organizationId
    ) {
      totalInvitations
      pendingInvitations
      acceptedInvitations
      expiredInvitations
      acceptanceRate
    }
  }
`;

/**
 * Expire old pending invitations (admin utility)
 */
export const EXPIRE_OLD_INVITATIONS = `
  mutation ExpireOldInvitations {
    expireOldInvitations
  }
`;

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create and send a user invitation
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<InvitationResult> {
  const response = await graphql<{ createInvitation: InvitationResult }>(
    CREATE_INVITATION,
    { input }
  );
  return response.createInvitation;
}

/**
 * Resend an existing invitation
 */
export async function resendInvitation(
  invitationId: string
): Promise<InvitationResult> {
  const response = await graphql<{ resendInvitation: InvitationResult }>(
    RESEND_INVITATION,
    { input: { invitationId } }
  );
  return response.resendInvitation;
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(
  invitationId: string,
  cancellationReason?: string
): Promise<boolean> {
  const response = await graphql<{ cancelInvitation: boolean }>(
    CANCEL_INVITATION,
    { input: { invitationId, cancellationReason } }
  );
  return response.cancelInvitation;
}

/**
 * Verify an invitation token
 */
export async function verifyInvitationToken(
  invitationToken: string
): Promise<InvitationTokenClaims> {
  const response = await graphql<{
    verifyInvitationToken: InvitationTokenClaims;
  }>(VERIFY_INVITATION_TOKEN, { input: { invitationToken } });
  return response.verifyInvitationToken;
}

/**
 * Get invitation statistics for an organization
 */
export async function getInvitationStats(
  organizationType: string,
  organizationId: string
): Promise<InvitationStats> {
  const response = await graphql<{ getInvitationStats: InvitationStats }>(
    GET_INVITATION_STATS,
    { organizationType, organizationId }
  );
  return response.getInvitationStats;
}

/**
 * Expire old pending invitations
 */
export async function expireOldInvitations(): Promise<number> {
  const response = await graphql<{ expireOldInvitations: number }>(
    EXPIRE_OLD_INVITATIONS
  );
  return response.expireOldInvitations;
}
