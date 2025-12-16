/**
 * Education Type Definitions - Type-Specific Student Features
 *
 * This file contains TypeScript types for different educational institution
 * subcategories. Each type has specialized fields based on best practices:
 *
 * - Primary/Secondary: Guardians with pickup/dropoff
 * - University/College: Next of kin (emergency contact) with course tracking
 * - Vocational: Certifications, apprenticeships
 * - Special Education: IEP plans, therapies
 * - Online Learning: Virtual engagement metrics
 */

// ============================================================================
// BASE TYPES & ENUMS
// ============================================================================

export type InstitutionSubcategory =
  | 'PrimarySchool'
  | 'SecondarySchool'
  | 'University'
  | 'College'
  | 'VocationalSchool'
  | 'SpecialEducation'
  | 'LanguageSchool'
  | 'OnlineLearningPlatform';

export type StudentType =
  | 'primary'
  | 'secondary'
  | 'university'
  | 'vocational'
  | 'special_education'
  | 'online_learning';

export type EnrollmentStatus = 'active' | 'suspended' | 'graduated' | 'withdrawn' | 'transferred' | 'completed' | 'incomplete' | 'failed';

export type StudentStatus = 'checked_in' | 'checked_out' | 'in_class' | 'on_trip' | 'picked_up';

// ============================================================================
// BASE STUDENT (Common to all types)
// ============================================================================

export interface BaseStudent {
  id: string;
  institutionId: string;
  personalAccountId?: string; // If student has app

  // Identity
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // ISO date
  gender?: string;
  photoUrl?: string;

  // School Info
  gradeLevel?: string; // "Grade 5", "Form 3", "Year 1", "Freshman"
  classSection?: string; // "5A", "Form 3 Blue"
  studentIdNumber: string;
  studentEmail?: string;
  studentPhone?: string;

  // Status
  enrollmentStatus: EnrollmentStatus;
  currentStatus: StudentStatus;
  checkedInAt?: string; // ISO datetime
  checkedOutAt?: string;

  // Teachers/Advisors
  homeroomTeacherId?: string;
  currentClassTeacherId?: string;
  academicAdvisorId?: string; // For universities

  // Health & Safety
  hasAllergies: boolean;
  allergyDetails?: string;
  hasMedicalConditions: boolean;
  medicalConditions?: string;
  specialNeeds?: string;
  medicalEmergencyNotes?: string;

  // Overrides
  requiresGuardian?: boolean;
  canSelfCheckout?: boolean;

  // Timestamps
  enrollmentDate: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// GUARDIANS (Primary/Secondary/Special Ed ONLY)
// ============================================================================

export type GuardianRelationshipType =
  | 'mother'
  | 'father'
  | 'stepmother'
  | 'stepfather'
  | 'grandmother'
  | 'grandfather'
  | 'aunt'
  | 'uncle'
  | 'legal_guardian'
  | 'grandparent'
  | 'sibling'
  | 'foster_parent'
  | 'other';

export interface Guardian {
  id: string;
  studentId?: string;

  // Guardian Identity
  guardianPersonalAccountId?: string; // If they have app
  guardianFullName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianIdPassportNumber?: string;

  // Relationship
  relationshipType: GuardianRelationshipType;
  isPrimaryGuardian?: boolean;
  isEmergencyContact?: boolean;
  contactPriority?: number; // 1 = first to contact

  // Pickup Authorization
  canPickup: boolean;
  canAuthorizeOthers: boolean;
  requiresApprovalEachTime?: boolean;

  // Contact Details
  residentialAddress?: string;
  workplaceName?: string;
  workplacePhone?: string;

  // Notes & Status
  notes?: string;
  courtOrderRestrictions?: string;
  isActive?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorizedPickupPerson {
  id: string;
  studentId: string;

  // Person Identity
  personPersonalAccountId?: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  idPassportNumber: string;
  photoUrl?: string;
  relationship: string; // "neighbor", "aunt", "uncle", "family_friend", "nanny"

  // Authorization
  authorizedByGuardianId: string;
  authorizationDate: string; // ISO date
  validFrom: string;
  validUntil?: string;

  // Time Restrictions
  canPickupAnytime: boolean;
  allowedDays?: string[]; // ["monday", "tuesday", "friday"]
  allowedTimeStart?: string; // "15:00"
  allowedTimeEnd?: string; // "18:00"
  maxPickupsPerMonth?: number;

  // Status
  isActive: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UNIVERSITY/COLLEGE STUDENTS (18+)
// ============================================================================

/**
 * Next of Kin - Emergency Contact ONLY
 * NOT a guardian - does NOT have app access or guardian privileges
 */
export interface NextOfKin {
  name: string;
  relationship?: string; // "mother", "father", "spouse", "sibling", "friend"
  phone: string;
  email?: string;
  address?: string;
}

export interface SecondaryContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export type AcademicStanding = 'good_standing' | 'academic_probation' | 'academic_suspension' | 'dean_list';

export type ResidentialStatus = 'on_campus' | 'off_campus' | 'commuter' | 'international_student_housing';

export type ScholarshipStatus = 'none' | 'partial' | 'full' | 'need_based' | 'merit_based';

export interface UniversityStudentDetails {
  studentId: string;

  // Academic Information
  yearOfStudy?: number; // 1, 2, 3, 4
  semester?: string; // "Fall 2024", "Spring 2025"
  major?: string;
  minor?: string;
  degreeProgram?: string; // "Bachelor of Science in Computer Science"
  faculty?: string; // "Faculty of Engineering"
  department?: string; // "Department of Computer Science"
  concentration?: string; // "Artificial Intelligence"

  // Academic Status
  academicStanding?: AcademicStanding;
  gpa?: number; // 0.00 to 4.00
  cumulativeGpa?: number;
  totalCreditsEarned?: number;
  totalCreditsRequired?: number;
  creditsInProgress?: number;
  expectedGraduationDate?: string; // ISO date
  graduationDate?: string;

  // Academic Advisor (Faculty)
  academicAdvisorId?: string;
  advisorEmail?: string;
  advisorPhone?: string;
  lastAdvisorMeetingDate?: string;
  advisor?: {
    name?: string;
    email?: string;
    phone?: string;
    officeLocation?: string;
  };

  // Financial
  scholarshipStatus?: ScholarshipStatus;
  scholarshipName?: string;
  scholarshipAmount?: number;
  financialAidStatus?: string;
  tuitionBalance?: number;
  paymentPlan?: string; // "full_upfront", "semester", "monthly"
  financialAid?: {
    scholarshipName?: string;
    scholarshipAmount?: number;
    financialAidStatus?: string;
  };

  // Campus Life
  residentialStatus?: ResidentialStatus;
  dormBuilding?: string;
  dormRoom?: string;
  mealPlanType?: string;
  campusLife?: {
    dormBuilding?: string;
    dormRoom?: string;
    mealPlanType?: string;
  };

  // Next of Kin (Emergency Contact ONLY - NOT guardian)
  nextOfKin?: NextOfKin;
  secondaryContact?: SecondaryContact;

  // International Students
  isInternationalStudent?: boolean;
  countryOfOrigin?: string;
  visaType?: string;
  visaExpiryDate?: string;
  passportNumber?: string;

  // Leave Status
  isOnLeave?: boolean;
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveReason?: string;

  // Exchange Students
  isExchangeStudent?: boolean;
  exchangeProgramName?: string;
  homeUniversity?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface UniversityStudent extends BaseStudent {
  type: 'university';
  details: UniversityStudentDetails;
  enrolledCourses: CourseEnrollment[];
  // NO guardians - university students are adults
}

// ============================================================================
// COURSE ENROLLMENTS (University/College)
// ============================================================================

export type EnrollmentStatusType = 'active' | 'enrolled' | 'completed' | 'dropped' | 'withdrawn' | 'failed' | 'incomplete' | 'in_progress';

export interface CourseSchedule {
  [day: string]: string[]; // {"monday": ["09:00-11:00"], "wednesday": ["09:00-11:00"]}
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  institutionId: string;

  // Course Info
  courseCode: string; // "CS101", "MATH201"
  courseName: string;
  courseDescription?: string;
  credits: number; // 3, 4, 6
  semester: string; // "Fall 2024"
  academicYear?: string; // "2024/2025"

  // Instructor
  instructorId?: string;
  instructorName?: string;
  instructorEmail?: string;

  // Schedule & Location
  lectureHall?: string;
  lectureBuilding?: string;
  schedule?: CourseSchedule;

  // Assessment
  midtermScore?: number; // Out of 100
  finalScore?: number;
  courseworkScore?: number;
  totalScore?: number;
  currentScore?: number; // Current overall score
  grade?: string; // "A", "B+", "C", "F", "W" (withdrawn)
  gradePoints?: number; // 4.0, 3.7, 3.3

  // Status
  enrollmentStatus: EnrollmentStatusType;
  enrollmentDate: string;
  completionDate?: string;
  withdrawalDate?: string;
  withdrawalReason?: string;

  // Attendance
  classesAttended: number;
  classesTotal?: number;
  attendancePercentage?: number;

  prerequisitesMet: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VOCATIONAL STUDENTS
// ============================================================================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CertificationStatus = 'in_progress' | 'exam_ready' | 'certified' | 'expired';

export type JobPlacementStatus = 'seeking' | 'placed' | 'employed' | 'self_employed';

export interface VocationalStudentDetails {
  studentId: string;

  // Program Information
  programName: string; // "Automotive Technology", "Culinary Arts"
  certificationType?: string; // "Certificate", "Diploma", "Trade License"
  trainingTrack?: string; // "Full-time", "Part-time", "Evening"
  programDurationMonths?: number;

  // Skills & Competencies
  skillLevel?: SkillLevel;
  competenciesCompleted?: string[]; // ["Engine Repair", "Brake Systems"]
  competenciesInProgress?: string[];
  competenciesTotal?: number;
  completionPercentage?: number;

  // Practical Training
  practicalHoursCompleted: number;
  practicalHoursRequired?: number;
  theoryHoursCompleted: number;
  theoryHoursRequired?: number;

  // Apprenticeship
  isInApprenticeship: boolean;
  employerName?: string;
  employerContactName?: string;
  employerContactPhone?: string;
  employerContactEmail?: string;
  apprenticeshipSupervisorName?: string;
  apprenticeshipStartDate?: string;
  apprenticeshipEndDate?: string;
  apprenticeshipStipend?: number; // Monthly stipend

  // Certification
  certificationStatus: CertificationStatus;
  certificationExamDate?: string;
  certificationExamScore?: number;
  certificationNumber?: string; // License number
  certificationIssuedDate?: string;
  certificationExpiryDate?: string;
  certifyingBody?: string;

  // Job Placement
  jobPlacementStatus?: JobPlacementStatus;
  jobPlacementEmployer?: string;
  jobPlacementPosition?: string;
  jobPlacementDate?: string;
  jobPlacementSalary?: number;

  // Equipment
  hasOwnTools: boolean;
  toolsProvidedBySchool: boolean;
  safetyCertificationComplete: boolean;
  safetyCertificationDate?: string;

  createdAt: string;
  updatedAt: string;
}

export interface VocationalStudent extends BaseStudent {
  type: 'vocational';
  details: VocationalStudentDetails;
  guardians?: Guardian[]; // May have guardians if under 18
}

// ============================================================================
// SPECIAL EDUCATION STUDENTS
// ============================================================================

export type PlanType = 'IEP' | '504' | 'IFSP';

export type IEPStatus = 'active' | 'under_review' | 'completed' | 'suspended';

export type CareLevel = 'standard' | 'moderate' | 'intensive' | 'one_on_one';

export type DisabilitySeverity = 'mild' | 'moderate' | 'severe' | 'profound';

export type TherapyFrequency = 'Daily' | 'Weekly' | '2x per week' | '3x per week' | 'Monthly';

export interface Medication {
  name: string;
  dosage: string;
  time: string; // "08:00, 14:00"
  administeredBy: string; // "Nurse", "Teacher"
}

export interface SpecialEducationStudentDetails {
  studentId: string;

  // Educational Plan (IEP/504)
  planType: PlanType;
  iepStatus: IEPStatus;
  iepDocumentUrl?: string;
  lastIepReviewDate?: string;
  nextIepReviewDate: string; // Required - compliance
  iepGoals?: string;

  // Disabilities
  primaryDisability?: string;
  secondaryDisabilities?: string[];
  disabilitySeverity?: DisabilitySeverity;

  // Accommodations
  accommodationsRequired?: string[]; // ["Extended test time", "Quiet room"]
  classroomModifications?: string[]; // ["Preferential seating", "Visual schedule"]

  // Medical & Care
  medications?: Medication[];
  requiresMedicationAdministration: boolean;
  careLevel: CareLevel;
  requiresOneOnOneAide: boolean;
  aideAssignedId?: string;
  aideName?: string;

  // Mobility & Communication
  mobilityEquipment?: string; // "Wheelchair", "Walker"
  requiresLiftAssistance: boolean;
  communicationMethod?: string; // "Verbal", "Sign Language", "AAC Device"
  aacDeviceType?: string;

  // Sensory Sensitivities
  sensoryProfile?: string;
  soundSensitivity: boolean;
  lightSensitivity: boolean;
  touchSensitivity: boolean;
  requiresSensoryBreaks: boolean;
  sensoryRoomAccess: boolean;

  // Therapy Services
  receivesSpeechTherapy: boolean;
  speechTherapistId?: string;
  speechTherapyFrequency?: TherapyFrequency;
  speechTherapyGoals?: string;

  receivesOccupationalTherapy: boolean;
  occupationalTherapistId?: string;
  otFrequency?: TherapyFrequency;
  otGoals?: string;

  receivesPhysicalTherapy: boolean;
  physicalTherapistId?: string;
  ptFrequency?: TherapyFrequency;
  ptGoals?: string;

  receivesBehavioralTherapy: boolean;
  behavioralTherapistId?: string;
  behavioralTherapyFrequency?: TherapyFrequency;

  // Behavioral Support
  hasBehaviorInterventionPlan: boolean;
  bipDocumentUrl?: string;
  behaviorTriggers?: string;
  deEscalationStrategies?: string;
  positiveReinforcementStrategies?: string;
  crisisInterventionPlan?: string;

  // Parent Communication (Enhanced)
  parentCommunicationFrequency: string; // "daily", "weekly"
  preferredCommunicationMethod: string; // "app", "email", "phone"
  requiresDailyReport: boolean;
  requiresBehaviorLog: boolean;

  // Transition Planning
  transitionPlanningStarted: boolean;
  transitionPlanUrl?: string;
  postSchoolGoals?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SpecialEducationStudent extends BaseStudent {
  type: 'special_education';
  details: SpecialEducationStudentDetails;
  guardians: Guardian[]; // ALWAYS required for special ed
}

// ============================================================================
// ONLINE LEARNING STUDENTS
// ============================================================================

export type PlatformAccountStatus = 'active' | 'suspended' | 'graduated' | 'inactive';

export type EnrollmentType = 'self_paced' | 'instructor_led' | 'hybrid' | 'cohort_based';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';

export interface PreferredLearningHours {
  [day: string]: string[]; // {"monday": ["18:00-21:00"], "saturday": ["09:00-17:00"]}
}

export interface OnlineLearningStudentDetails {
  studentId: string;

  // Digital Profile
  learningPlatformUsername?: string;
  platformAccountStatus: PlatformAccountStatus;
  enrollmentType?: EnrollmentType;

  // Time Zone & Availability (for global students)
  studentTimezone?: string; // "America/New_York", "Africa/Nairobi"
  preferredLearningHours?: PreferredLearningHours;

  // Course Progress
  coursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  currentCourseIds?: string[];
  completionPercentage?: number;

  // Engagement Metrics
  lastLoginAt?: string; // ISO datetime
  totalLoginCount: number;
  averageSessionDurationMinutes?: number;
  videosWatched: number;
  totalVideoWatchTimeHours?: number;
  assignmentsSubmitted: number;
  assignmentsOnTime: number;
  quizzesTaken: number;
  averageQuizScore?: number;
  forumPostsCount: number;
  forumRepliesCount: number;
  peerInteractionsCount: number;

  // Virtual Attendance (for scheduled sessions)
  scheduledSessionsTotal: number;
  scheduledSessionsAttended: number;
  scheduledSessionsMissed: number;
  attendanceRate?: number;

  // Communication
  preferredCommunicationChannel?: string; // "email", "chat", "video_call"
  instructorId?: string;
  instructorName?: string;
  lastInstructorContactDate?: string;
  requiresExtraSupport: boolean;

  // Technical Setup
  hasReliableInternet?: boolean;
  internetSpeedMbps?: number;
  deviceType?: string; // "laptop", "desktop", "tablet", "smartphone"
  operatingSystem?: string;
  browser?: string;
  requiresTechnicalSupport: boolean;
  technicalIssuesReported: number;

  // Learning Style & Accessibility
  learningStyle?: LearningStyle;
  requiresClosedCaptions: boolean;
  requiresScreenReader: boolean;
  preferredContentFormat?: string; // "video", "text", "interactive"

  // Performance & At-Risk Detection
  overallGrade?: number;
  atRiskOfDropout: boolean;
  riskFactors?: string[]; // ["Low engagement", "Multiple missed sessions"]
  interventionRequired: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface OnlineLearningStudent extends BaseStudent {
  type: 'online_learning';
  details: OnlineLearningStudentDetails;
}

// ============================================================================
// PRIMARY/SECONDARY STUDENTS (With Guardians)
// ============================================================================

export interface PrimarySchoolStudent extends BaseStudent {
  type: 'primary';
  guardians: Guardian[]; // REQUIRED for primary
  authorizedPickupPersons: AuthorizedPickupPerson[];
  currentLocation?: string; // "Classroom 2A", "Playground"
  lastSeenAt?: string;
}

export interface SecondarySchoolStudent extends BaseStudent {
  type: 'secondary';
  guardians: Guardian[]; // REQUIRED but with more autonomy
  authorizedPickupPersons?: AuthorizedPickupPerson[]; // Optional for older students
  gpa?: number;
  currentSemester?: string;
  disciplinaryStatus?: string;
  clubs?: string[];
  sportsTeams?: string[];
}

// ============================================================================
// UNION TYPE - All Student Types
// ============================================================================

export type Student =
  | PrimarySchoolStudent
  | SecondarySchoolStudent
  | UniversityStudent
  | VocationalStudent
  | SpecialEducationStudent
  | OnlineLearningStudent;

// ============================================================================
// HELPER FUNCTIONS & TYPE GUARDS
// ============================================================================

export function isUniversityStudent(student: Student): student is UniversityStudent {
  return student.type === 'university';
}

export function isPrimaryStudent(student: Student): student is PrimarySchoolStudent {
  return student.type === 'primary';
}

export function isSecondaryStudent(student: Student): student is SecondarySchoolStudent {
  return student.type === 'secondary';
}

export function isVocationalStudent(student: Student): student is VocationalStudent {
  return student.type === 'vocational';
}

export function isSpecialEducationStudent(student: Student): student is SpecialEducationStudent {
  return student.type === 'special_education';
}

export function isOnlineLearningStudent(student: Student): student is OnlineLearningStudent {
  return student.type === 'online_learning';
}

/**
 * Determine if student type requires guardians (with pickup privileges)
 */
export function requiresGuardians(studentType: StudentType): boolean {
  return ['primary', 'secondary', 'special_education'].includes(studentType);
}

/**
 * Determine if student type uses next of kin (emergency contact only)
 */
export function usesNextOfKin(studentType: StudentType): boolean {
  return ['university'].includes(studentType);
}

/**
 * Determine if student type has pickup/dropoff system
 */
export function hasPickupDropoff(studentType: StudentType): boolean {
  return ['primary', 'special_education'].includes(studentType);
  // Secondary schools may have conditional pickup based on age
}

/**
 * Get appropriate contact label for student type
 */
export function getContactLabel(studentType: StudentType): string {
  if (usesNextOfKin(studentType)) {
    return 'Next of Kin (Emergency Contact)';
  }
  return 'Parents/Guardians';
}

/**
 * Map institution subcategory to student type
 */
export function subcategoryToStudentType(subcategory: InstitutionSubcategory): StudentType {
  const map: Record<InstitutionSubcategory, StudentType> = {
    'PrimarySchool': 'primary',
    'SecondarySchool': 'secondary',
    'University': 'university',
    'College': 'university',
    'VocationalSchool': 'vocational',
    'SpecialEducation': 'special_education',
    'LanguageSchool': 'primary', // Treat similar to primary
    'OnlineLearningPlatform': 'online_learning',
  };
  return map[subcategory];
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface AddUniversityDetailsInput {
  studentId: string;
  yearOfStudy?: number;
  semester?: string;
  major?: string;
  minor?: string;
  degreeProgram?: string;
  faculty?: string;
  department?: string;
  nextOfKinName: string; // Required
  nextOfKinRelationship?: string;
  nextOfKinPhone: string; // Required
  nextOfKinEmail?: string;
  nextOfKinAddress?: string;
  residentialStatus?: string;
  scholarshipStatus?: string;
}

export interface UpdateNextOfKinInput {
  studentId: string;
  nextOfKinName: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone: string;
  nextOfKinEmail?: string;
  nextOfKinAddress?: string;
}

export interface EnrollInCourseInput {
  studentId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: string;
  instructorId?: string;
}

export interface AddVocationalDetailsInput {
  studentId: string;
  programName: string;
  certificationType?: string;
  trainingTrack?: string;
  practicalHoursRequired?: number;
  employerName?: string;
  employerContactName?: string;
  employerContactPhone?: string;
}

export interface AddGuardianInput {
  studentId: string;
  guardianFullName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianIdPassportNumber?: string;
  relationshipType: GuardianRelationshipType;
  isPrimaryGuardian: boolean;
  canPickup: boolean;
  canAuthorizeOthers: boolean;
}

// ============================================================================
// TIMETABLE MANAGEMENT TYPES
// ============================================================================

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface InstitutionClass {
  id: string;
  institutionId: string;
  className: string;
  gradeLevel?: string;
  section?: string;
  academicYear: string;
  maxStudents?: number;
  classTeacherId?: string;
  classTeacherName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionRoom {
  id: string;
  institutionId: string;
  roomName: string;
  buildingName?: string;
  floor?: number;
  capacity?: number;
  roomType?: string;
  hasWhiteboard: boolean;
  hasProjector: boolean;
  facilities?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  institutionId: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddClassInput {
  institutionId: string;
  className: string;
  gradeLevel?: string;
  section?: string;
  academicYear: string;
  maxStudents?: number;
  classTeacherId?: string;
}

export interface AddRoomInput {
  institutionId: string;
  roomName: string;
  buildingName?: string;
  floor?: number;
  capacity?: number;
  roomType?: string;
  hasWhiteboard?: boolean;
  hasProjector?: boolean;
  facilities?: string;
}

export interface AddTimetableSlotInput {
  institutionId: string;
  classId?: string;
  subjectId?: string;
  subjectName: string;
  teacherId?: string;
  roomId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
}

export interface UpdateTimetableSlotInput {
  slotId: string;
  classId?: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  roomId?: string;
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
}

// ============================================================================
// LIBRARY MANAGEMENT TYPES
// ============================================================================

export interface LibraryBook {
  id: string;
  institutionId: string;
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  category?: string;
  totalCopies: number;
  availableCopies: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookLoan {
  id: string;
  institutionId: string;
  bookId: string;
  bookTitle?: string;
  borrowerStudentId?: string;
  borrowerStaffId?: string;
  borrowerName?: string;
  borrowerType?: string;
  checkedOutBy?: string;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  renewalCount: number;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export interface LibraryLateFee {
  id: string;
  institutionId: string;
  loanId: string;
  amountDue: number;
  amountPaid: number;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddBookInput {
  institutionId: string;
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  category?: string;
  totalCopies: number;
}

export interface CheckoutBookInput {
  institutionId: string;
  bookId: string;
  borrowerStudentId?: string;
  borrowerStaffId?: string;
  dueDate: string;
}

export interface LibrarySearchFilters {
  institutionId: string;
  searchTerm?: string;
  category?: string;
  availableOnly?: boolean;
}

// ============================================================================
// ONLINE DIARY SYSTEM TYPES (Primary Schools Only)
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_dismissal';
export type AssignmentType = 'homework' | 'reading' | 'project' | 'study' | 'practice';

export interface StudentDiaryEntry {
  id: string;
  studentId: string;
  entryDate: string; // YYYY-MM-DD format
  teacherName?: string;
  generalNotes?: string;
  behaviorNotes?: string;
  attendanceStatus?: AttendanceStatus;
  assignments: DiaryAssignment[];
  isAcknowledged: boolean;
  acknowledgmentDate?: string;
}

export interface DiaryAssignment {
  id: string;
  subjectName: string;
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  dueDate?: string; // YYYY-MM-DD format
  isUrgent: boolean;
  isCompleted: boolean;
}

export interface AddDiaryEntryInput {
  studentId: string;
  entryDate: string;
  generalNotes?: string;
  behaviorNotes?: string;
  attendanceStatus?: AttendanceStatus;
}

export interface AddDiaryAssignmentInput {
  diaryEntryId: string;
  subjectId?: string;
  subjectName: string;
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  dueDate?: string;
  isUrgent?: boolean;
}

export interface AcknowledgeDiaryInput {
  diaryEntryId: string;
  parentNotes?: string;
  assignmentsCompleted: string[]; // Array of assignment IDs
}
