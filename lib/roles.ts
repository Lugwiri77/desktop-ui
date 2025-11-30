/**
 * Role and Permission utilities for Business and Institution accounts
 */

export enum UserRoleType {
  BusinessAdministrator = 'BusinessAdministrator',
  BusinessStaff = 'BusinessStaff',
  InstitutionAdministrator = 'InstitutionAdministrator',
  InstitutionStaff = 'InstitutionStaff',
  Personal = 'Personal', // Not allowed in desktop app
  SuperUser = 'SuperUser', // Not allowed in desktop app
}

export enum AccountType {
  Business = 'Business',
  Institution = 'Institution',
  Personal = 'Personal', // Not allowed
}

export interface Roles {
  is_super_admin?: boolean;
  is_chief_executive_officer?: boolean;
  is_chairman?: boolean;
  is_board_of_directors?: boolean;
  is_director?: boolean;
  is_admin?: boolean;
  is_hr?: boolean;
  is_procurement?: boolean;
  is_finance?: boolean;
  is_maintenance?: boolean;
  is_public_relations?: boolean;
  is_security?: boolean;
  is_store_keeper?: boolean;
  is_transport?: boolean;
  // Executive support staff roles (for VIP visitor auto-routing)
  is_secretary?: boolean;
  is_executive_assistant?: boolean;
  is_personal_assistant?: boolean;
}

export interface Permissions {
  can_create?: boolean;
  can_update?: boolean;
  can_approve?: boolean;
  can_delete?: boolean;
  can_write?: boolean;
  can_read?: boolean;
  can_publish?: boolean;
}

export interface UserInfo {
  username: string;
  email: string;
  userRole: UserRoleType;
  accountType: AccountType;
  organizationType?: string;
  organizationName?: string;
  organizationId?: string;
  roles?: Roles;
  permissions?: Permissions;
  profilePicUrl?: string;
  logoUrl?: string;
  taxId?: string;
  staffRole?: string;  // e.g., "DepartmentManager", "Staff", "HRManager"
  department?: string; // e.g., "Security", "HR", "IT"
  userId: string;
  educationalInstitutionSubcategory?: string; // e.g., "PrimarySchool", "University", "College"
  realEstateBusinessSubcategory?: string; // e.g., "ResidentialRealEstate", "CommercialRealEstate"
}

/**
 * Parse user role from backend response
 */
export function parseUserRole(userRoleData: any): UserRoleType {
  if (typeof userRoleData === 'string') {
    // Handle string enum variant
    if (userRoleData.includes('BusinessAdministrator')) return UserRoleType.BusinessAdministrator;
    if (userRoleData.includes('BusinessStaff')) return UserRoleType.BusinessStaff;
    if (userRoleData.includes('InstitutionAdministrator')) return UserRoleType.InstitutionAdministrator;
    if (userRoleData.includes('InstitutionStaff')) return UserRoleType.InstitutionStaff;
    if (userRoleData.includes('Personal')) return UserRoleType.Personal;
    if (userRoleData.includes('SuperUser')) return UserRoleType.SuperUser;
  }

  // Handle object representation
  if (typeof userRoleData === 'object' && userRoleData !== null) {
    if ('BusinessAdministrator' in userRoleData) return UserRoleType.BusinessAdministrator;
    if ('BusinessStaff' in userRoleData) return UserRoleType.BusinessStaff;
    if ('InstitutionAdministrator' in userRoleData) return UserRoleType.InstitutionAdministrator;
    if ('InstitutionStaff' in userRoleData) return UserRoleType.InstitutionStaff;
    if ('Personal' in userRoleData) return UserRoleType.Personal;
    if ('SuperUser' in userRoleData) return UserRoleType.SuperUser;
  }

  throw new Error('Invalid user role format');
}

/**
 * Get account type from user role
 */
export function getAccountType(userRole: UserRoleType): AccountType {
  switch (userRole) {
    case UserRoleType.BusinessAdministrator:
    case UserRoleType.BusinessStaff:
      return AccountType.Business;
    case UserRoleType.InstitutionAdministrator:
    case UserRoleType.InstitutionStaff:
      return AccountType.Institution;
    case UserRoleType.Personal:
      return AccountType.Personal;
    default:
      throw new Error('Unknown user role type');
  }
}

/**
 * Check if user is an administrator
 */
export function isAdministrator(userRole: UserRoleType): boolean {
  return (
    userRole === UserRoleType.BusinessAdministrator ||
    userRole === UserRoleType.InstitutionAdministrator
  );
}

/**
 * Check if user is staff
 */
export function isStaff(userRole: UserRoleType): boolean {
  return (
    userRole === UserRoleType.BusinessStaff ||
    userRole === UserRoleType.InstitutionStaff
  );
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permissions: Permissions | undefined, permission: keyof Permissions): boolean {
  if (!permissions) return false;
  return permissions[permission] === true;
}

/**
 * Check if user has a specific role
 */
export function hasRole(roles: Roles | undefined, role: keyof Roles): boolean {
  if (!roles) return false;
  return roles[role] === true;
}

/**
 * Get user role display name
 */
export function getUserRoleDisplayName(userRole: UserRoleType): string {
  switch (userRole) {
    case UserRoleType.BusinessAdministrator:
      return 'Business Administrator';
    case UserRoleType.BusinessStaff:
      return 'Business Staff';
    case UserRoleType.InstitutionAdministrator:
      return 'Institution Administrator';
    case UserRoleType.InstitutionStaff:
      return 'Institution Staff';
    case UserRoleType.Personal:
      return 'Personal Account';
    case UserRoleType.SuperUser:
      return 'Super User';
    default:
      return 'Unknown';
  }
}

/**
 * Get account type display name
 */
export function getAccountTypeDisplayName(accountType: AccountType): string {
  switch (accountType) {
    case AccountType.Business:
      return 'Business';
    case AccountType.Institution:
      return 'Institution';
    case AccountType.Personal:
      return 'Personal';
    default:
      return 'Unknown';
  }
}

/**
 * Check if user is from an educational institution
 */
export function isEducationInstitution(accountType: AccountType, organizationType?: string): boolean {
  // Must be an institution account
  if (accountType !== AccountType.Institution) {
    return false;
  }

  // Check various formats of education organization type
  if (!organizationType) {
    return false;
  }

  const orgTypeLower = organizationType.toLowerCase();
  return (
    orgTypeLower === 'education' ||
    orgTypeLower === 'institution' ||
    orgTypeLower === 'educationalinstitution' ||
    orgTypeLower.includes('education')
  );
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    const userRoleStr = localStorage.getItem('user_role');
    const email = localStorage.getItem('user_email');
    return !!(userRoleStr && email);
  } catch (error) {
    return false;
  }
}

/**
 * Load user info from localStorage
 */
export function loadUserInfo(): UserInfo | null {
  try {
    const userRoleStr = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('user_email');
    const userId = localStorage.getItem('user_id');
    const organizationType = localStorage.getItem('organization_type');
    const organizationName = localStorage.getItem('organization_name');
    const organizationId = localStorage.getItem('organization_id');
    const profilePicUrl = localStorage.getItem('profile_pic_url');
    const logoUrl = localStorage.getItem('logo_url');
    const taxId = localStorage.getItem('tax_identification_number');
    let staffRole = localStorage.getItem('staff_role');
    let department = localStorage.getItem('department');
    const educationalInstitutionSubcategory = localStorage.getItem('educational_institution_subcategory');
    const realEstateBusinessSubcategory = localStorage.getItem('real_estate_business_subcategory');

    console.log('📋 loadUserInfo - Full Debug:', {
      organizationName,
      organizationType,
      organizationId,
      logoUrl,
      staffRole,
      department,
      userId,
      educationalInstitutionSubcategory,
      realEstateBusinessSubcategory,
    });

    if (!userRoleStr || !email || !userId) {
      return null;
    }

    const userRoleData = JSON.parse(userRoleStr);
    const userRole = parseUserRole(userRoleData);
    const accountType = getAccountType(userRole);

    // IMPORTANT: Administrators should NOT have staff_role or department
    // Only staff members (BusinessStaff, InstitutionStaff) should have these fields
    const isAdmin = userRole === UserRoleType.BusinessAdministrator ||
                    userRole === UserRoleType.InstitutionAdministrator;

    if (isAdmin && (staffRole || department)) {
      console.warn('⚠️ Administrator should not have staff_role or department. Clearing these fields.');
      localStorage.removeItem('staff_role');
      localStorage.removeItem('department');
      staffRole = null;
      department = null;
    }

    // For staff, try to load roles and permissions from backend
    // (This would typically be fetched from an API call)
    const roles: Roles | undefined = undefined;
    const permissions: Permissions | undefined = undefined;

    return {
      username: username || email,
      email,
      userId,
      userRole,
      accountType,
      organizationType: organizationType || undefined,
      organizationName: organizationName || undefined,
      organizationId: organizationId || undefined,
      roles,
      permissions,
      profilePicUrl: profilePicUrl || undefined,
      logoUrl: logoUrl || undefined,
      taxId: taxId || undefined,
      staffRole: staffRole || undefined,
      department: department || undefined,
      educationalInstitutionSubcategory: educationalInstitutionSubcategory || undefined,
      realEstateBusinessSubcategory: realEstateBusinessSubcategory || undefined,
    };
  } catch (error) {
    console.error('Failed to load user info:', error);
    return null;
  }
}

/**
 * Check if user is allowed to access desktop app
 */
export function isAllowedUser(userRole: UserRoleType): boolean {
  return (
    userRole === UserRoleType.BusinessAdministrator ||
    userRole === UserRoleType.BusinessStaff ||
    userRole === UserRoleType.InstitutionAdministrator ||
    userRole === UserRoleType.InstitutionStaff
  );
}

/**
 * Check if user is a Security Department Manager
 * Security managers can manage gates but NOT locations
 */
export function isSecurityDepartmentManager(userInfo: UserInfo): boolean {
  if (!isStaff(userInfo.userRole)) return false;
  return (
    userInfo.department === 'Security' &&
    userInfo.staffRole === 'DepartmentManager'
  );
}

/**
 * Check if user can manage gates (update/delete)
 * Administrators and Security Department Managers can manage gates
 */
export function canManageGates(userInfo: UserInfo): boolean {
  return isAdministrator(userInfo.userRole) || isSecurityDepartmentManager(userInfo);
}

/**
 * Check if institution is a Primary or Secondary school
 * These institutions need grade levels and class sections
 */
export function isPrimaryOrSecondarySchool(userInfo: UserInfo): boolean {
  if (!userInfo.educationalInstitutionSubcategory) return false;
  const subcategory = userInfo.educationalInstitutionSubcategory.toLowerCase();
  return subcategory === 'primaryschool' || subcategory === 'secondaryschool';
}

/**
 * Check if institution is a University or College
 * These institutions need programme/course instead of grade/class
 */
export function isUniversityOrCollege(userInfo: UserInfo): boolean {
  if (!userInfo.educationalInstitutionSubcategory) return false;
  const subcategory = userInfo.educationalInstitutionSubcategory.toLowerCase();
  return subcategory === 'university' || subcategory === 'college';
}

/**
 * Check if institution is Vocational School
 * Hybrid approach with optional guardian management based on age
 */
export function isVocationalSchool(userInfo: UserInfo): boolean {
  if (!userInfo.educationalInstitutionSubcategory) return false;
  return userInfo.educationalInstitutionSubcategory.toLowerCase() === 'vocationalschool';
}

/**
 * Check if business is Real Estate type
 * These businesses should see property management features
 */
export function isRealEstateBusiness(userInfo: UserInfo): boolean {
  if (!userInfo.realEstateBusinessSubcategory) return false;
  return true; // Any real estate subcategory means it's a real estate business
}

/**
 * Check if business is Residential Real Estate
 */
export function isResidentialRealEstate(userInfo: UserInfo): boolean {
  if (!userInfo.realEstateBusinessSubcategory) return false;
  return userInfo.realEstateBusinessSubcategory.toLowerCase() === 'residentialrealestate';
}

/**
 * Check if business is Commercial Real Estate
 */
export function isCommercialRealEstate(userInfo: UserInfo): boolean {
  if (!userInfo.realEstateBusinessSubcategory) return false;
  return userInfo.realEstateBusinessSubcategory.toLowerCase() === 'commercialrealestate';
}

/**
 * Get appropriate field labels based on institution type
 */
export function getStudentFieldLabels(userInfo: UserInfo): {
  gradeLevelLabel: string;
  classSectionLabel: string;
  shouldShowGradeLevel: boolean;
  shouldShowClassSection: boolean;
} {
  if (isUniversityOrCollege(userInfo)) {
    return {
      gradeLevelLabel: 'Programme/Course',
      classSectionLabel: 'Year of Study',
      shouldShowGradeLevel: true,
      shouldShowClassSection: true,
    };
  } else if (isPrimaryOrSecondarySchool(userInfo)) {
    return {
      gradeLevelLabel: 'Grade Level',
      classSectionLabel: 'Class Section',
      shouldShowGradeLevel: true,
      shouldShowClassSection: true,
    };
  } else {
    return {
      gradeLevelLabel: 'Level',
      classSectionLabel: 'Section/Group',
      shouldShowGradeLevel: true,
      shouldShowClassSection: true,
    };
  }
}
