/**
 * Education Institution GraphQL API
 *
 * This file contains all GraphQL queries and mutations for educational institution features.
 * These correspond to the backend queries in backend/src/graphql/queries/education.rs
 */

import { gql } from '@apollo/client';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Search for student by ID number, name, or email (for security check-in)
 * Backend: search_student_for_checkin
 */
export const SEARCH_STUDENT_FOR_CHECKIN = gql`
  query SearchStudentForCheckin($institutionId: String!, $searchQuery: String!) {
    searchStudentForCheckin(institutionId: $institutionId, searchQuery: $searchQuery) {
      id
      firstName
      lastName
      photoUrl
      studentIdNumber
      gradeLevel
      classSection
      currentStatus
      hasAllergies
      hasMedicalConditions
      medicalEmergencyNotes
      homeroomTeacherFirstName
      homeroomTeacherLastName
      homeroomTeacherPhone
      guardians
    }
  }
`;

/**
 * Get student profile by QR code scan
 * Backend: get_student_by_qr
 */
export const GET_STUDENT_BY_QR = gql`
  query GetStudentByQr($qrCodeData: String!) {
    getStudentByQr(qrCodeData: $qrCodeData) {
      id
      firstName
      lastName
      photoUrl
      studentIdNumber
      gradeLevel
      classSection
      currentStatus
      hasAllergies
      hasMedicalConditions
      medicalEmergencyNotes
      homeroomTeacherFirstName
      homeroomTeacherLastName
      homeroomTeacherPhone
      guardians
    }
  }
`;

/**
 * Get institution settings (for admin settings page)
 * Backend: get_institution_settings
 */
export const GET_INSTITUTION_SETTINGS = gql`
  query GetInstitutionSettings($institutionId: String!) {
    getInstitutionSettings(institutionId: $institutionId) {
      id
      institutionName
      educationalInstitutionSubcategory
      enablePickupDropoff
      enableGuardianManagement
      minorStudentAgeThreshold
      requirePickupApproval
      approvalTimeoutMinutes
      requirePhotoVerification
      requireSignatureOnPickup
    }
  }
`;

/**
 * Get institution statistics (for dashboard)
 * Backend: get_institution_statistics
 */
export const GET_INSTITUTION_STATISTICS = gql`
  query GetInstitutionStatistics($institutionId: String!) {
    getInstitutionStatistics(institutionId: $institutionId) {
      totalStudents
      studentsCheckedIn
      pendingApprovals
      todaysActivities
    }
  }
`;

/**
 * Get pending pickup approvals for staff
 * Backend: get_pending_pickup_approvals
 */
export const GET_PENDING_PICKUP_APPROVALS = gql`
  query GetPendingPickupApprovals($institutionId: String!) {
    getPendingPickupApprovals(institutionId: $institutionId) {
      id
      studentName
      studentGrade
      requesterName
      requesterPhone
      requesterRelationship
      approvalStatus
      approvalMethod
      otpRequired
      expiresAt
      createdAt
    }
  }
`;

/**
 * Get all institutions a personal account is affiliated with
 * Backend: get_my_institutions
 */
export const GET_MY_INSTITUTIONS = gql`
  query GetMyInstitutions {
    getMyInstitutions {
      id
      relationType
      institutionId
      institutionName
      institutionCategory
      educationalInstitutionSubcategory
      institutionLogo
      city
      country
      createdAt
    }
  }
`;

/**
 * Get student profile for current personal account
 * Backend: get_my_student_profile
 */
export const GET_MY_STUDENT_PROFILE = gql`
  query GetMyStudentProfile($institutionId: String!) {
    getMyStudentProfile(institutionId: $institutionId) {
      id
      firstName
      lastName
      photoUrl
      studentIdNumber
      gradeLevel
      classSection
      currentStatus
      institutionName
      institutionLogo
      homeroomTeacherName
      homeroomTeacherPhone
    }
  }
`;

/**
 * Get children for parent account
 * Backend: get_my_children
 */
export const GET_MY_CHILDREN = gql`
  query GetMyChildren($institutionId: String) {
    getMyChildren(institutionId: $institutionId) {
      id
      firstName
      lastName
      photoUrl
      age
      gradeLevel
      classSection
      studentIdNumber
      currentStatus
      institutionName
      institutionLogo
      institutionSubcategory
      relationshipType
      isPrimaryGuardian
      canPickup
    }
  }
`;

/**
 * Get check-in history for a student
 * Backend: get_student_checkin_history
 */
export const GET_STUDENT_CHECKIN_HISTORY = gql`
  query GetStudentCheckinHistory($studentId: String!, $limit: Int) {
    getStudentCheckinHistory(studentId: $studentId, limit: $limit) {
      id
      actionType
      actionTime
      personName
      personType
      gateLocation
      reason
      isEmergency
      approvalStatus
    }
  }
`;

/**
 * Get student attendance summary
 * Backend: get_student_attendance_summary
 */
export const GET_STUDENT_ATTENDANCE_SUMMARY = gql`
  query GetStudentAttendanceSummary(
    $studentId: String!
    $fromDate: String
    $toDate: String
  ) {
    getStudentAttendanceSummary(
      studentId: $studentId
      fromDate: $fromDate
      toDate: $toDate
    ) {
      daysPresent
      emergencyPickups
      avgHoursAtSchool
    }
  }
`;

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Request student pickup approval (called by security)
 * Backend: request_student_pickup
 */
export const REQUEST_STUDENT_PICKUP = gql`
  mutation RequestStudentPickup($input: RequestStudentPickupInput!) {
    requestStudentPickup(input: $input) {
      id
      studentName
      studentGrade
      requesterName
      requesterPhone
      requesterRelationship
      approvalStatus
      approvalMethod
      otpRequired
      expiresAt
      createdAt
    }
  }
`;

/**
 * Approve student pickup with OTP
 * Backend: approve_student_pickup_with_otp
 */
export const APPROVE_STUDENT_PICKUP_WITH_OTP = gql`
  mutation ApproveStudentPickupWithOtp($input: ApproveStudentPickupInput!) {
    approveStudentPickupWithOtp(input: $input) {
      message
      success
    }
  }
`;

/**
 * Approve student pickup via push notification (no OTP)
 * Backend: approve_student_pickup_via_push
 */
export const APPROVE_STUDENT_PICKUP_VIA_PUSH = gql`
  mutation ApproveStudentPickupViaPush($approvalId: String!, $staffNotes: String) {
    approveStudentPickupViaPush(approvalId: $approvalId, staffNotes: $staffNotes) {
      message
      success
    }
  }
`;

/**
 * Reject student pickup
 * Backend: reject_student_pickup
 */
export const REJECT_STUDENT_PICKUP = gql`
  mutation RejectStudentPickup($input: RejectStudentPickupInput!) {
    rejectStudentPickup(input: $input) {
      message
      success
    }
  }
`;

/**
 * Register a new student
 * Backend: register_student
 */
export const REGISTER_STUDENT = gql`
  mutation RegisterStudent($input: RegisterStudentInput!) {
    registerStudent(input: $input) {
      id
      institutionId
      firstName
      lastName
      studentIdNumber
      gradeLevel
      classSection
      enrollmentStatus
      currentStatus
      hasAllergies
      hasMedicalConditions
      photoUrl
      createdAt
    }
  }
`;

/**
 * Add a guardian relationship for a student
 * Backend: add_guardian_relationship
 */
export const ADD_GUARDIAN_RELATIONSHIP = gql`
  mutation AddGuardianRelationship($input: AddGuardianRelationshipInput!) {
    addGuardianRelationship(input: $input) {
      message
      success
    }
  }
`;

/**
 * Authorize a person to pick up a student
 * Backend: authorize_pickup_person
 */
export const AUTHORIZE_PICKUP_PERSON = gql`
  mutation AuthorizePickupPerson($input: AuthorizePickupPersonInput!) {
    authorizePickupPerson(input: $input) {
      message
      success
    }
  }
`;

/**
 * Update institution settings
 * NOTE: This mutation needs to be added to the backend
 */
export const UPDATE_INSTITUTION_SETTINGS = gql`
  mutation UpdateInstitutionSettings($input: UpdateInstitutionSettingsInput!) {
    updateInstitutionSettings(input: $input) {
      message
      success
    }
  }
`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Guardian {
  guardian_name: string;
  guardian_phone: string;
  relationship_type: string;
  can_pickup: boolean;
}

export interface StudentCheckInProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  studentIdNumber: string;
  gradeLevel?: string;
  classSection?: string;
  currentStatus: string;
  hasAllergies: boolean;
  hasMedicalConditions: boolean;
  medicalEmergencyNotes?: string;
  homeroomTeacherFirstName?: string;
  homeroomTeacherLastName?: string;
  homeroomTeacherPhone?: string;
  guardians?: Guardian[];
}

export interface InstitutionSettings {
  id: string;
  institutionName: string;
  educationalInstitutionSubcategory?: string;
  enablePickupDropoff: boolean;
  enableGuardianManagement: boolean;
  minorStudentAgeThreshold: number;
  requirePickupApproval: boolean;
  approvalTimeoutMinutes: number;
  requirePhotoVerification: boolean;
  requireSignatureOnPickup: boolean;
}

export interface InstitutionStatistics {
  totalStudents: number;
  studentsCheckedIn: number;
  pendingApprovals: number;
  todaysActivities: number;
}

export interface InstitutionAffiliation {
  id: string;
  relationType: string;
  institutionId: string;
  institutionName: string;
  institutionCategory: string;
  educationalInstitutionSubcategory?: string;
  institutionLogo?: string;
  city?: string;
  country: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  studentIdNumber: string;
  gradeLevel?: string;
  classSection?: string;
  currentStatus: string;
  institutionName: string;
  institutionLogo?: string;
  homeroomTeacherName?: string;
  homeroomTeacherPhone?: string;
}

export interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  age: number;
  gradeLevel?: string;
  classSection?: string;
  studentIdNumber: string;
  currentStatus: string;
  institutionName: string;
  institutionLogo?: string;
  institutionSubcategory: string;
  relationshipType: string;
  isPrimaryGuardian: boolean;
  canPickup: boolean;
}

export interface CheckInHistory {
  id: string;
  actionType: string;
  actionTime: string;
  personName: string;
  personType: string;
  gateLocation?: string;
  reason?: string;
  isEmergency: boolean;
  approvalStatus?: string;
}

export interface AttendanceSummary {
  daysPresent: number;
  emergencyPickups: number;
  avgHoursAtSchool: number;
}

export interface StudentPickupApproval {
  id: string;
  studentName: string;
  studentGrade?: string;
  requesterName: string;
  requesterPhone?: string;
  requesterRelationship?: string;
  approvalStatus: string;
  approvalMethod: 'Sms' | 'Push' | 'Email' | 'Whatsapp';
  otpRequired: boolean;
  expiresAt: string;
  createdAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse guardians JSON from backend response
 */
export function parseGuardians(guardiansJson: any): Guardian[] {
  if (!guardiansJson) return [];

  try {
    if (typeof guardiansJson === 'string') {
      return JSON.parse(guardiansJson);
    }
    return guardiansJson;
  } catch (error) {
    console.error('Failed to parse guardians JSON:', error);
    return [];
  }
}

/**
 * Format student status for display
 */
export function formatStudentStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status.toLowerCase()) {
    case 'checked_in':
    case 'in_class':
      return 'success';
    case 'checked_out':
      return 'default';
    case 'picked_up':
    case 'on_trip':
      return 'warning';
    default:
      return 'info';
  }
}
