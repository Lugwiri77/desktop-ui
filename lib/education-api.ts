/**
 * Education Institution GraphQL API
 *
 * This file contains all GraphQL queries and mutations for educational institution features.
 * These correspond to the backend queries in backend/src/graphql/queries/education.rs
 *
 * NOTE: This project uses a custom GraphQL client (lib/graphql.ts), NOT Apollo Client.
 * Queries are plain template strings, not gql tagged templates.
 */

import { graphql } from './graphql';

// Re-export graphql for use in components
export { graphql };

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Search for student by ID number, name, or email (for security check-in)
 * Backend: search_student_for_checkin
 */
export const SEARCH_STUDENT_FOR_CHECKIN = `
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
export const GET_STUDENT_BY_QR = `
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
export const GET_INSTITUTION_SETTINGS = `
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
export const GET_INSTITUTION_STATISTICS = `
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
export const GET_PENDING_PICKUP_APPROVALS = `
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
export const GET_MY_INSTITUTIONS = `
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
export const GET_MY_STUDENT_PROFILE = `
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
export const GET_MY_CHILDREN = `
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
export const GET_STUDENT_CHECKIN_HISTORY = `
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
export const GET_STUDENT_ATTENDANCE_SUMMARY = `
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
export const REQUEST_STUDENT_PICKUP = `
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
export const APPROVE_STUDENT_PICKUP_WITH_OTP = `
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
export const APPROVE_STUDENT_PICKUP_VIA_PUSH = `
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
export const REJECT_STUDENT_PICKUP = `
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
export const REGISTER_STUDENT = `
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
export const ADD_GUARDIAN_RELATIONSHIP = `
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
export const AUTHORIZE_PICKUP_PERSON = `
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
export const UPDATE_INSTITUTION_SETTINGS = `
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
// TIMETABLE MANAGEMENT QUERIES & MUTATIONS
// ============================================================================

/**
 * Get all classes for an institution
 * Backend: get_institution_classes
 * Supports optional filtering by academic year
 */
export const GET_INSTITUTION_CLASSES = `
  query GetInstitutionClasses($institutionId: String!, $academicYear: String) {
    getInstitutionClasses(institutionId: $institutionId, academicYear: $academicYear) {
      id
      institutionId
      className
      gradeLevel
      section
      academicYear
      maxStudents
      currentStudents
      classTeacherId
      classTeacherName
      isActive
    }
  }
`;

/**
 * Get all rooms for an institution
 * Backend: get_institution_rooms
 */
export const GET_INSTITUTION_ROOMS = `
  query GetInstitutionRooms($institutionId: String!) {
    getInstitutionRooms(institutionId: $institutionId) {
      id
      institutionId
      roomName
      buildingName
      floor
      capacity
      roomType
      hasWhiteboard
      hasProjector
      facilities
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get timetable for a specific class
 * Backend: get_class_timetable
 */
export const GET_CLASS_TIMETABLE = `
  query GetClassTimetable($classId: String!) {
    getClassTimetable(classId: $classId) {
      id
      institutionId
      classId
      className
      subjectId
      subjectName
      teacherId
      teacherName
      roomId
      roomName
      dayOfWeek
      startTime
      endTime
      isRecurring
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get timetable for a specific teacher
 * Backend: get_teacher_timetable
 */
export const GET_TEACHER_TIMETABLE = `
  query GetTeacherTimetable($teacherId: String!) {
    getTeacherTimetable(teacherId: $teacherId) {
      id
      institutionId
      classId
      className
      subjectId
      subjectName
      teacherId
      teacherName
      roomId
      roomName
      dayOfWeek
      startTime
      endTime
      isRecurring
      createdAt
      updatedAt
    }
  }
`;

/**
 * Add a new class
 * Backend: add_class
 */
export const ADD_CLASS = `
  mutation AddClass($input: AddClassInput!) {
    addClass(input: $input) {
      id
      institutionId
      className
      gradeLevel
      section
      academicYear
      maxStudents
      currentStudents
      classTeacherId
      classTeacherName
      isActive
    }
  }
`;

/**
 * Add a new room
 * Backend: add_room
 */
export const ADD_ROOM = `
  mutation AddRoom($input: AddRoomInput!) {
    addRoom(input: $input) {
      id
      institutionId
      roomName
      buildingName
      floor
      capacity
      roomType
      hasWhiteboard
      hasProjector
      facilities
      createdAt
      updatedAt
    }
  }
`;

/**
 * Add a timetable slot
 * Backend: add_timetable_slot
 */
export const ADD_TIMETABLE_SLOT = `
  mutation AddTimetableSlot($input: AddTimetableSlotInput!) {
    addTimetableSlot(input: $input) {
      success
      message
    }
  }
`;

/**
 * Update a timetable slot
 * Backend: update_timetable_slot
 */
export const UPDATE_TIMETABLE_SLOT = `
  mutation UpdateTimetableSlot($input: UpdateTimetableSlotInput!) {
    updateTimetableSlot(input: $input) {
      success
      message
    }
  }
`;

/**
 * Delete a timetable slot
 * Backend: delete_timetable_slot
 */
export const DELETE_TIMETABLE_SLOT = `
  mutation DeleteTimetableSlot($slotId: String!) {
    deleteTimetableSlot(slotId: $slotId) {
      success
      message
    }
  }
`;

// ============================================================================
// LIBRARY MANAGEMENT QUERIES & MUTATIONS
// ============================================================================

/**
 * Search library books
 * Backend: search_library_books
 */
export const SEARCH_LIBRARY_BOOKS = `
  query SearchLibraryBooks($institutionId: String!, $searchQuery: String, $category: String, $limit: Int) {
    searchLibraryBooks(institutionId: $institutionId, searchQuery: $searchQuery, category: $category, limit: $limit) {
      id
      institutionId
      title
      subtitle
      authors
      isbn
      publisher
      publicationDate
      edition
      language
      category
      subcategory
      deweyDecimal
      totalCopies
      availableCopies
      location
      description
      coverImageUrl
      pageCount
      isActive
    }
  }
`;

/**
 * Get current user's book loans
 * Backend: get_my_book_loans
 */
export const GET_MY_BOOK_LOANS = `
  query GetMyBookLoans($institutionId: String!) {
    getMyBookLoans(institutionId: $institutionId) {
      id
      institutionId
      bookId
      bookTitle
      borrowerStudentId
      borrowerStaffId
      borrowerName
      borrowerType
      checkedOutBy
      checkoutDate
      dueDate
      returnDate
      renewalCount
      status
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get all book loans (admin/librarian view)
 * Backend: get_all_book_loans
 */
export const GET_ALL_BOOK_LOANS = `
  query GetAllBookLoans($institutionId: String!) {
    getAllBookLoans(institutionId: $institutionId) {
      id
      institutionId
      bookId
      bookTitle
      borrowerStudentId
      borrowerStaffId
      borrowerName
      borrowerType
      checkedOutBy
      checkoutDate
      dueDate
      returnDate
      renewalCount
      status
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get overdue books
 * Backend: get_overdue_books
 */
export const GET_OVERDUE_BOOKS = `
  query GetOverdueBooks($institutionId: String!) {
    getOverdueBooks(institutionId: $institutionId) {
      id
      institutionId
      bookId
      bookTitle
      borrowerStudentId
      borrowerStaffId
      borrowerName
      borrowerType
      checkedOutBy
      checkoutDate
      dueDate
      returnDate
      renewalCount
      status
      createdAt
      updatedAt
    }
  }
`;

/**
 * Add a new book to library
 * Backend: add_book
 */
export const ADD_BOOK = `
  mutation AddBook($input: AddBookInput!) {
    addBook(input: $input) {
      id
      institutionId
      title
      authors
      isbn
      publisher
      publicationYear
      category
      totalCopies
      availableCopies
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Checkout a book
 * Backend: checkout_book
 */
export const CHECKOUT_BOOK = `
  mutation CheckoutBook($input: CheckoutBookInput!) {
    checkoutBook(input: $input) {
      success
      message
    }
  }
`;

/**
 * Return a book
 * Backend: return_book
 */
export const RETURN_BOOK = `
  mutation ReturnBook($loanId: String!) {
    returnBook(loanId: $loanId) {
      success
      message
    }
  }
`;

/**
 * Renew a book loan
 * Backend: renew_book
 */
export const RENEW_BOOK = `
  mutation RenewBook($loanId: String!) {
    renewBook(loanId: $loanId) {
      id
      institutionId
      bookId
      bookTitle
      borrowerStudentId
      borrowerStaffId
      borrowerName
      borrowerType
      checkedOutBy
      checkoutDate
      dueDate
      returnDate
      renewalCount
      status
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// ONLINE DIARY SYSTEM QUERIES & MUTATIONS (Primary Schools Only)
// ============================================================================

/**
 * Get student diary entries
 * Backend: get_student_diary
 */
export const GET_STUDENT_DIARY = `
  query GetStudentDiary($studentId: String!, $startDate: String, $endDate: String) {
    getStudentDiary(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id
      studentId
      entryDate
      teacherName
      generalNotes
      behaviorNotes
      attendanceStatus
      assignments {
        id
        subjectName
        title
        description
        assignmentType
        dueDate
        isUrgent
        isCompleted
      }
      isAcknowledged
      acknowledgmentDate
    }
  }
`;

/**
 * Get unacknowledged diary entries for parent
 * Backend: get_unacknowledged_diaries
 */
export const GET_UNACKNOWLEDGED_DIARIES = `
  query GetUnacknowledgedDiaries {
    getUnacknowledgedDiaries {
      id
      studentId
      entryDate
      teacherName
      generalNotes
      behaviorNotes
      attendanceStatus
      assignments {
        id
        subjectName
        title
        description
        assignmentType
        dueDate
        isUrgent
        isCompleted
      }
      isAcknowledged
      acknowledgmentDate
    }
  }
`;

/**
 * Add a diary entry (teachers only)
 * Backend: add_diary_entry
 */
export const ADD_DIARY_ENTRY = `
  mutation AddDiaryEntry($input: AddDiaryEntryInput!) {
    addDiaryEntry(input: $input) {
      success
      message
    }
  }
`;

/**
 * Add an assignment to a diary entry (teachers only)
 * Backend: add_diary_assignment
 */
export const ADD_DIARY_ASSIGNMENT = `
  mutation AddDiaryAssignment($input: AddDiaryAssignmentInput!) {
    addDiaryAssignment(input: $input) {
      success
      message
    }
  }
`;

/**
 * Acknowledge a diary entry (parents/guardians only)
 * Backend: acknowledge_diary
 */
export const ACKNOWLEDGE_DIARY = `
  mutation AcknowledgeDiary($input: AcknowledgeDiaryInput!) {
    acknowledgeDiary(input: $input) {
      success
      message
    }
  }
`;

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

// ============================================================================
// HELPER FUNCTIONS FOR EXECUTING QUERIES
// ============================================================================

import type * as Types from '@/types/education';

/**
 * Execute timetable queries
 * Get all classes for an institution, optionally filtered by academic year
 */
export async function getInstitutionClasses(
  institutionId: string,
  academicYear?: string
): Promise<Types.InstitutionClass[]> {
  const data = await graphql<{ getInstitutionClasses: Types.InstitutionClass[] }>(
    GET_INSTITUTION_CLASSES,
    { institutionId, academicYear }
  );
  return data.getInstitutionClasses || [];
}

export async function getInstitutionRooms(institutionId: string): Promise<Types.InstitutionRoom[]> {
  const data = await graphql<{ getInstitutionRooms: Types.InstitutionRoom[] }>(
    GET_INSTITUTION_ROOMS,
    { institutionId }
  );
  return data.getInstitutionRooms;
}

export async function getClassTimetable(classId: string): Promise<Types.TimetableSlot[]> {
  const data = await graphql<{ getClassTimetable: Types.TimetableSlot[] }>(
    GET_CLASS_TIMETABLE,
    { classId }
  );
  return data.getClassTimetable;
}

export async function getTeacherTimetable(teacherId: string): Promise<Types.TimetableSlot[]> {
  const data = await graphql<{ getTeacherTimetable: Types.TimetableSlot[] }>(
    GET_TEACHER_TIMETABLE,
    { teacherId }
  );
  return data.getTeacherTimetable;
}

/**
 * Execute library queries
 */
export async function searchLibraryBooks(filters: Types.LibrarySearchFilters): Promise<Types.LibraryBook[]> {
  const data = await graphql<{ searchLibraryBooks: Types.LibraryBook[] }>(
    SEARCH_LIBRARY_BOOKS,
    filters
  );
  return data.searchLibraryBooks;
}

export async function getMyBookLoans(institutionId: string): Promise<Types.BookLoan[]> {
  const data = await graphql<{ getMyBookLoans: Types.BookLoan[] }>(
    GET_MY_BOOK_LOANS,
    { institutionId }
  );
  return data.getMyBookLoans;
}

export async function getAllBookLoans(institutionId: string): Promise<Types.BookLoan[]> {
  const data = await graphql<{ getAllBookLoans: Types.BookLoan[] }>(
    GET_ALL_BOOK_LOANS,
    { institutionId }
  );
  return data.getAllBookLoans;
}

export async function getOverdueBooks(institutionId: string): Promise<Types.BookLoan[]> {
  const data = await graphql<{ getOverdueBooks: Types.BookLoan[] }>(
    GET_OVERDUE_BOOKS,
    { institutionId }
  );
  return data.getOverdueBooks;
}

/**
 * Execute diary queries
 */
export async function getStudentDiary(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<Types.StudentDiaryEntry[]> {
  const data = await graphql<{ getStudentDiary: Types.StudentDiaryEntry[] }>(
    GET_STUDENT_DIARY,
    { studentId, startDate, endDate }
  );
  return data.getStudentDiary;
}

export async function getUnacknowledgedDiaries(): Promise<Types.StudentDiaryEntry[]> {
  const data = await graphql<{ getUnacknowledgedDiaries: Types.StudentDiaryEntry[] }>(
    GET_UNACKNOWLEDGED_DIARIES
  );
  return data.getUnacknowledgedDiaries;
}

/**
 * Execute mutations (returns success/message)
 */
interface MutationResponse {
  success: boolean;
  message: string;
}

export async function addDiaryEntry(input: Types.AddDiaryEntryInput): Promise<MutationResponse> {
  const data = await graphql<{ addDiaryEntry: MutationResponse }>(
    ADD_DIARY_ENTRY,
    { input }
  );
  return data.addDiaryEntry;
}

export async function addDiaryAssignment(input: Types.AddDiaryAssignmentInput): Promise<MutationResponse> {
  const data = await graphql<{ addDiaryAssignment: MutationResponse }>(
    ADD_DIARY_ASSIGNMENT,
    { input }
  );
  return data.addDiaryAssignment;
}

export async function acknowledgeDiary(input: Types.AcknowledgeDiaryInput): Promise<MutationResponse> {
  const data = await graphql<{ acknowledgeDiary: MutationResponse }>(
    ACKNOWLEDGE_DIARY,
    { input }
  );
  return data.acknowledgeDiary;
}

export async function addTimetableSlot(input: Types.AddTimetableSlotInput): Promise<MutationResponse> {
  const data = await graphql<{ addTimetableSlot: MutationResponse }>(
    ADD_TIMETABLE_SLOT,
    { input }
  );
  return data.addTimetableSlot;
}

export async function checkoutBook(input: Types.CheckoutBookInput): Promise<MutationResponse> {
  const data = await graphql<{ checkoutBook: MutationResponse }>(
    CHECKOUT_BOOK,
    { input }
  );
  return data.checkoutBook;
}

export async function returnBook(loanId: string): Promise<MutationResponse> {
  const data = await graphql<{ returnBook: MutationResponse }>(
    RETURN_BOOK,
    { loanId }
  );
  return data.returnBook;
}

export async function renewBook(loanId: string): Promise<Types.BookLoan> {
  const data = await graphql<{ renewBook: Types.BookLoan }>(
    RENEW_BOOK,
    { loanId }
  );
  return data.renewBook;
}

// ============================================================================
// SCHOOL FEES QUERIES
// ============================================================================

/**
 * Get fee structures for an institution
 * Backend: get_fee_structures
 */
export const GET_FEE_STRUCTURES = `
  query GetFeeStructures(
    $institutionId: String!
    $academicYear: String
    $term: AcademicTermEnum
    $isActive: Boolean
  ) {
    getFeeStructures(
      institutionId: $institutionId
      academicYear: $academicYear
      term: $term
      isActive: $isActive
    ) {
      id
      institutionId
      feeName
      feeType
      description
      amountKes
      academicYear
      term
      gradeLevel
      isMandatory
      dueDaysAfterTermStart
      lateFeePercentage
      lateFeeFlatKes
      applyLateFeeAfterDays
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get fee statistics for dashboard
 * Backend: get_fee_statistics
 */
export const GET_FEE_STATISTICS = `
  query GetFeeStatistics(
    $institutionId: String!
    $academicYear: String!
    $term: AcademicTermEnum!
  ) {
    getFeeStatistics(
      institutionId: $institutionId
      academicYear: $academicYear
      term: $term
    ) {
      institutionId
      academicYear
      term
      totalStudentsWithFees
      totalFeeAssignments
      totalExpectedKes
      totalCollectedKes
      totalPendingKes
      totalOverdueKes
      studentsWithArrears
      totalDiscountsGivenKes
      averageDiscountPercentage
    }
  }
`;

/**
 * Get student fee assignments
 * Backend: get_student_fee_assignments
 */
export const GET_STUDENT_FEE_ASSIGNMENTS = `
  query GetStudentFeeAssignments(
    $studentId: String!
    $academicYear: String
    $term: AcademicTermEnum
  ) {
    getStudentFeeAssignments(
      studentId: $studentId
      academicYear: $academicYear
      term: $term
    ) {
      id
      studentId
      institutionId
      feeStructureId
      feeStructureName
      academicYear
      term
      originalAmountKes
      discountAmountKes
      discountPercentage
      finalAmountKes
      discountReason
      invoiceId
      invoiceGeneratedAt
      isWaived
      waiverReason
      assignedAt
      updatedAt
    }
  }
`;

/**
 * Get all fee assignments for an institution
 * Backend: get_all_fee_assignments
 */
export const GET_ALL_FEE_ASSIGNMENTS = `
  query GetAllFeeAssignments(
    $institutionId: String!
    $academicYear: String
    $term: AcademicTermEnum
    $gradeLevel: String
  ) {
    getAllFeeAssignments(
      institutionId: $institutionId
      academicYear: $academicYear
      term: $term
      gradeLevel: $gradeLevel
    ) {
      id
      studentId
      studentName
      gradeLevel
      feeStructureName
      academicYear
      term
      originalAmountKes
      discountAmountKes
      finalAmountKes
      invoiceId
      isWaived
      assignedAt
    }
  }
`;

// ============================================================================
// SCHOOL FEES MUTATIONS
// ============================================================================

/**
 * Create a new fee structure
 * Backend: create_fee_structure
 */
export const CREATE_FEE_STRUCTURE = `
  mutation CreateFeeStructure($input: CreateFeeStructureInput!) {
    createFeeStructure(input: $input) {
      id
      institutionId
      feeName
      feeType
      description
      amountKes
      academicYear
      term
      gradeLevel
      isMandatory
      dueDaysAfterTermStart
      lateFeePercentage
      lateFeeFlatKes
      applyLateFeeAfterDays
      isActive
      createdAt
    }
  }
`;

/**
 * Delete (deactivate) a fee structure
 * Backend: delete_fee_structure
 */
export const DELETE_FEE_STRUCTURE = `
  mutation DeleteFeeStructure($feeStructureId: String!) {
    deleteFeeStructure(feeStructureId: $feeStructureId) {
      success
      message
    }
  }
`;

/**
 * Assign a fee to a specific student
 * Backend: assign_fee_to_student
 */
export const ASSIGN_FEE_TO_STUDENT = `
  mutation AssignFeeToStudent($input: AssignFeeToStudentInput!) {
    assignFeeToStudent(input: $input) {
      id
      studentId
      institutionId
      feeStructureId
      feeStructureName
      academicYear
      term
      originalAmountKes
      discountAmountKes
      discountPercentage
      finalAmountKes
      discountReason
      assignedAt
    }
  }
`;

/**
 * Bulk assign fees to all students in a grade level
 * Backend: bulk_assign_fees_by_grade
 */
export const BULK_ASSIGN_FEES_BY_GRADE = `
  mutation BulkAssignFeesByGrade($input: BulkAssignFeesByGradeInput!) {
    bulkAssignFeesByGrade(input: $input) {
      studentsAssigned
      feesAssigned
      totalAmountKes
    }
  }
`;

/**
 * Waive a fee for a student
 * Backend: waive_fee
 */
export const WAIVE_FEE = `
  mutation WaiveFee($input: WaiveFeeInput!) {
    waiveFee(input: $input) {
      success
      message
    }
  }
`;

/**
 * Apply discount to a student's fee assignment
 * Backend: apply_discount_to_fee
 */
export const APPLY_DISCOUNT_TO_FEE = `
  mutation ApplyDiscountToFee($input: ApplyDiscountInput!) {
    applyDiscountToFee(input: $input) {
      id
      studentId
      feeStructureId
      feeStructureName
      originalAmountKes
      discountAmountKes
      discountPercentage
      finalAmountKes
      discountReason
      updatedAt
    }
  }
`;

/**
 * Generate invoices for fee assignments (bulk)
 * Backend: generate_fee_invoices
 */
export const GENERATE_FEE_INVOICES = `
  mutation GenerateFeeInvoices($input: GenerateFeeInvoicesInput!) {
    generateFeeInvoices(input: $input) {
      invoicesGenerated
      studentsAffected
      totalAmountKes
      invoiceIds
    }
  }
`;

// ============================================================================
// SCHOOL FEES API FUNCTIONS
// ============================================================================

export async function getFeeStructures(
  institutionId: string,
  academicYear?: string,
  term?: string,
  isActive?: boolean
) {
  const data = await graphql<{ getFeeStructures: any[] }>(
    GET_FEE_STRUCTURES,
    { institutionId, academicYear, term, isActive }
  );
  return data.getFeeStructures;
}

export async function getFeeStatistics(
  institutionId: string,
  academicYear: string,
  term: string
) {
  const data = await graphql<{ getFeeStatistics: any }>(
    GET_FEE_STATISTICS,
    { institutionId, academicYear, term }
  );
  return data.getFeeStatistics;
}

export async function getStudentFeeAssignments(
  studentId: string,
  academicYear?: string,
  term?: string
) {
  const data = await graphql<{ getStudentFeeAssignments: any[] }>(
    GET_STUDENT_FEE_ASSIGNMENTS,
    { studentId, academicYear, term }
  );
  return data.getStudentFeeAssignments;
}

export async function getAllFeeAssignments(
  institutionId: string,
  academicYear?: string,
  term?: string,
  gradeLevel?: string
) {
  const data = await graphql<{ getAllFeeAssignments: any[] }>(
    GET_ALL_FEE_ASSIGNMENTS,
    { institutionId, academicYear, term, gradeLevel }
  );
  return data.getAllFeeAssignments;
}

export async function createFeeStructure(input: any) {
  const data = await graphql<{ createFeeStructure: any }>(
    CREATE_FEE_STRUCTURE,
    { input }
  );
  return data.createFeeStructure;
}

export async function deleteFeeStructure(feeStructureId: string) {
  const data = await graphql<{ deleteFeeStructure: MutationResponse }>(
    DELETE_FEE_STRUCTURE,
    { feeStructureId }
  );
  return data.deleteFeeStructure;
}

export async function assignFeeToStudent(input: any) {
  const data = await graphql<{ assignFeeToStudent: any }>(
    ASSIGN_FEE_TO_STUDENT,
    { input }
  );
  return data.assignFeeToStudent;
}

export async function bulkAssignFeesByGrade(input: any) {
  const data = await graphql<{ bulkAssignFeesByGrade: any }>(
    BULK_ASSIGN_FEES_BY_GRADE,
    { input }
  );
  return data.bulkAssignFeesByGrade;
}

export async function waiveFee(input: any) {
  const data = await graphql<{ waiveFee: MutationResponse }>(
    WAIVE_FEE,
    { input }
  );
  return data.waiveFee;
}

export async function applyDiscountToFee(input: any) {
  const data = await graphql<{ applyDiscountToFee: any }>(
    APPLY_DISCOUNT_TO_FEE,
    { input }
  );
  return data.applyDiscountToFee;
}

export async function generateFeeInvoices(input: any) {
  const data = await graphql<{ generateFeeInvoices: any }>(
    GENERATE_FEE_INVOICES,
    { input }
  );
  return data.generateFeeInvoices;
}

// ============================================================================
// DASHBOARD ANALYTICS QUERIES
// ============================================================================

const GET_FEE_COLLECTION_TRENDS = `
  query GetFeeCollectionTrends($institutionId: String!, $academicYear: String!) {
    getFeeCollectionTrends(institutionId: $institutionId, academicYear: $academicYear) {
      month
      collected
      pending
      target
    }
  }
`;

const GET_CLASS_PERFORMANCE = `
  query GetClassPerformance($institutionId: String!, $academicYear: String!, $term: AcademicTermEnum!) {
    getClassPerformance(institutionId: $institutionId, academicYear: $academicYear, term: $term) {
      className
      collected
      pending
      total
      percentage
    }
  }
`;

const GET_RECENT_FEE_TRANSACTIONS = `
  query GetRecentFeeTransactions($institutionId: String!, $limit: Int) {
    getRecentFeeTransactions(institutionId: $institutionId, limit: $limit) {
      id
      studentName
      amount
      feeType
      date
      status
    }
  }
`;

export async function getFeeCollectionTrends(
  institutionId: string,
  academicYear: string
) {
  const data = await graphql<{ getFeeCollectionTrends: any }>(
    GET_FEE_COLLECTION_TRENDS,
    { institutionId, academicYear }
  );
  return data.getFeeCollectionTrends;
}

export async function getClassPerformance(
  institutionId: string,
  academicYear: string,
  term: string
) {
  const data = await graphql<{ getClassPerformance: any }>(
    GET_CLASS_PERFORMANCE,
    { institutionId, academicYear, term }
  );
  return data.getClassPerformance;
}

export async function getRecentFeeTransactions(
  institutionId: string,
  limit?: number
) {
  const data = await graphql<{ getRecentFeeTransactions: any }>(
    GET_RECENT_FEE_TRANSACTIONS,
    { institutionId, limit }
  );
  return data.getRecentFeeTransactions;
}

const GET_GRADE_LEVELS = `
  query GetGradeLevels($institutionId: String!) {
    getGradeLevels(institutionId: $institutionId) {
      gradeLevel
      classSection
      name
      studentCount
    }
  }
`;

export async function getGradeLevels(institutionId: string) {
  const data = await graphql<{ getGradeLevels: any }>(
    GET_GRADE_LEVELS,
    { institutionId }
  );
  return data.getGradeLevels;
}

// ============================================================================
// CLASS MANAGEMENT
// ============================================================================
// Note: GET_INSTITUTION_CLASSES is already defined at line 506

export interface InstitutionClass {
  id: string;
  institutionId: string;
  className: string;
  gradeLevel: string;
  section?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  maxStudents?: number;
  currentStudents: number;
  academicYear: string;
  isActive: boolean;
}

// Note: getInstitutionClasses function is already defined at line 1031
// Note: ADD_CLASS GraphQL constant is already defined earlier in the file (line 607)

export interface AddClassInput {
  institutionId: string;
  className: string;
  gradeLevel: string;
  section?: string;
  academicYear: string;
  maxStudents?: number;
  classTeacherId?: string;
}

export async function addClass(input: AddClassInput): Promise<InstitutionClass> {
  const data = await graphql<{ addClass: InstitutionClass }>(
    ADD_CLASS,
    { input }
  );
  return data.addClass;
}
