/**
 * Layout utility functions for ApplicationLayout component
 */

import { UserInfo, isAdministrator } from './roles';

/**
 * Creates the userInfo object required by ApplicationLayout from a full UserInfo object
 * This ensures consistent data is passed to the layout across all pages
 */
export function createLayoutUserInfo(userInfo: UserInfo) {
  return {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdministrator(userInfo.userRole),
    staffRole: userInfo.staffRole,
    department: userInfo.department,
    educationalInstitutionSubcategory: userInfo.educationalInstitutionSubcategory,
    realEstateBusinessSubcategory: userInfo.realEstateBusinessSubcategory,
  };
}
