/**
 * External Security Staff Registration API
 * Direct connection to backend register_security_staff mutation
 */

import { graphql } from './graphql';

export type GateLocation = 'MAIN_GATE' | 'SIDE_GATE' | 'STAFF_ENTRANCE' | 'VIP_ENTRANCE' | 'PARKING_ENTRANCE' | 'BACK_ENTRANCE';

export interface RegisterExternalSecurityStaffInput {
  companyId?: string;
  organizationId?: string;
  organizationType?: 'BUSINESS' | 'INSTITUTION';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  workEmail: string;
  username: string;
  password: string;
  personalEmail?: string;
  role: 'SECURITY_GUARD' | 'TEAM_LEAD';
  badgeNumber: string;
  assignedGate?: GateLocation;
  profilePicUrl?: string;
  videoUrl?: string;
}

export interface RegisterExternalSecurityStaffResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  badgeNumber: string;
  isActive: boolean;
}

/**
 * Register external security staff
 * Department managers only - for Security Guards and Team Leads
 */
export async function registerExternalSecurityStaff(
  input: RegisterExternalSecurityStaffInput
): Promise<RegisterExternalSecurityStaffResponse> {
  const mutation = `
    mutation RegisterSecurityStaff($input: RegisterSecurityStaffInput!) {
      registerSecurityStaff(input: $input) {
        id
        firstName
        lastName
        email
        badgeNumber
        isActive
      }
    }
  `;

  const data = await graphql<{ registerSecurityStaff: RegisterExternalSecurityStaffResponse }>(
    mutation,
    { input }
  );

  return data.registerSecurityStaff;
}
