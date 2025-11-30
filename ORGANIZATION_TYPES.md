# Organization Types and Institution Subcategories

This document describes the organization type system implemented in the application, including access control, field variations, and UI adaptations based on organization type.

## Overview

The application supports three main account types:
- **Business** - Commercial organizations
- **Institution** - Educational institutions
- **Personal** - Individual accounts (not supported in desktop app)

Within these types, there are further subcategories that customize the UI and available features.

## Educational Institution Subcategories

Educational institutions can be one of the following types:

### Primary and Secondary Schools
- **Subcategories**: `PrimarySchool`, `SecondarySchool`
- **Student Fields**:
  - Grade Level: "Grade 10", "Form 3", etc.
  - Class Section: "A", "B", "Section 1", etc.
- **Features**:
  - Guardian management (required)
  - Student pickup/drop-off approval system
  - Class sections and homeroom teachers

### Universities and Colleges
- **Subcategories**: `University`, `College`
- **Student Fields**:
  - Programme/Course: "Computer Science", "Engineering", "Business Administration", etc.
  - Year of Study: "Year 1", "Year 2", "Year 3", "Year 4", etc.
- **Features**:
  - Student self-checkout capability
  - Academic advisors instead of homeroom teachers
  - Optional guardian management (age-based)

### Vocational Schools
- **Subcategory**: `VocationalSchool`
- **Student Fields**:
  - Level: Trade or skill program name
  - Section/Group: Training cohort or group
- **Features**:
  - Hybrid approach with optional guardian management
  - Age-based requirements

### Other Educational Institutions
- **Subcategories**: `SpecialEducation`, `LanguageSchool`, `OnlineLearningPlatform`
- **Student Fields**:
  - Default labels: "Level" and "Section/Group"
  - Flexible to accommodate various educational models

## Real Estate Business Subcategories

Real estate businesses can be:

### Residential Real Estate
- **Subcategory**: `ResidentialRealEstate`
- **Features**:
  - Tenant approval system for residential properties
  - Unit/apartment management
  - Visitor access control

### Commercial Real Estate
- **Subcategory**: `CommercialRealEstate`
- **Features**:
  - Tenant approval system for commercial properties
  - Office/retail space management
  - Business visitor management

## Implementation Details

### Backend

#### Database Fields
- `institution_account.educational_institution_subcategory` - Stores institution type enum
- `business_account.real_estate_business_subcategory` - Stores real estate type enum
- `institution_students.grade_level` - Flexible string field (can store grade, programme, etc.)
- `institution_students.class_section` - Flexible string field (can store section, year, etc.)

#### Login Response
The authentication endpoint returns subcategory information:

```rust
TokensResponse {
    // ... other fields
    educational_institution_subcategory: Option<String>,
    real_estate_business_subcategory: Option<String>,
}
```

Location: `/Users/allanlugwiri/RustroverProjects/backend/src/auth/login.rs`

### Frontend

#### Storage
Subcategories are stored in localStorage after successful login:
- `educational_institution_subcategory`
- `real_estate_business_subcategory`

Location: `/Users/allanlugwiri/RustRoverProjects/desktop-ui/app/components/LoginScreen.tsx`

#### Helper Functions

**File**: `/Users/allanlugwiri/RustRoverProjects/desktop-ui/lib/roles.ts`

```typescript
// Educational Institution Checks
isPrimaryOrSecondarySchool(userInfo: UserInfo): boolean
isUniversityOrCollege(userInfo: UserInfo): boolean
isVocationalSchool(userInfo: UserInfo): boolean
isEducationInstitution(accountType: AccountType, organizationType?: string): boolean

// Real Estate Checks
isRealEstateBusiness(userInfo: UserInfo): boolean
isResidentialRealEstate(userInfo: UserInfo): boolean
isCommercialRealEstate(userInfo: UserInfo): boolean

// Dynamic Field Labels
getStudentFieldLabels(userInfo: UserInfo): {
  gradeLevelLabel: string;
  classSectionLabel: string;
  shouldShowGradeLevel: boolean;
  shouldShowClassSection: boolean;
}
```

#### UI Adaptation

**Student Registration Form** (`/app/components/institution/StudentManagementSection.tsx`):

The form adapts its labels and placeholders based on institution type:

```typescript
// For Universities/Colleges
gradeLevelLabel: "Programme/Course"
classSectionLabel: "Year of Study"
placeholder: "e.g., Computer Science, Engineering"

// For Primary/Secondary Schools
gradeLevelLabel: "Grade Level"
classSectionLabel: "Class Section"
placeholder: "e.g., 10, Year 1, Freshman"
```

**CSV Template Generation**:

The CSV import template dynamically generates headers and examples:

```typescript
// University template
"Student ID Number,First Name,Middle Name,Last Name,Email,Phone Number,Gender,Programme/Course,Year of Study,Date of Birth
S001,John,Michael,Doe,john.doe@example.com,+1234567890,Male,Computer Science,Year 1,2005-01-15"

// School template
"Student ID Number,First Name,Middle Name,Last Name,Email,Phone Number,Gender,Grade Level,Class Section,Date of Birth
S001,John,Michael,Doe,john.doe@example.com,+1234567890,Male,10,A,2008-01-15"
```

## Access Control

### Navigation Visibility

**File**: `/Users/allanlugwiri/RustRoverProjects/desktop-ui/app/components/application-layout.tsx`

Navigation items are shown/hidden based on organization type:

```typescript
// Real Estate Tenant Approvals - Only visible to real estate businesses
{userInfo.realEstateBusinessSubcategory && (
  <SidebarItem href="/dashboard/real-estate/visitors">
    Tenant Approvals
  </SidebarItem>
)}

// Student Management - Only visible to educational institutions
{isEducationInstitution(userInfo.accountType, userInfo.organizationType) &&
 userInfo.isAdministrator && (
  <SidebarItem href="/student-management">
    Student Management
  </SidebarItem>
)}

// Student Check-in - Only visible to security staff at educational institutions
{isEducationInstitution(userInfo.accountType, userInfo.organizationType) &&
 (userInfo.staffRole === 'Security' || userInfo.department === 'Security') && (
  <SidebarItem href="/education/security-gate">
    Student Check-in
  </SidebarItem>
)}
```

### Layout Helper Function

**File**: `/Users/allanlugwiri/RustRoverProjects/desktop-ui/lib/layout-utils.ts`

A standardized helper function ensures consistent data is passed to ApplicationLayout:

```typescript
createLayoutUserInfo(userInfo: UserInfo) {
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
```

Usage in pages:
```typescript
const layoutUserInfo = createLayoutUserInfo(userInfo);

<ApplicationLayout userInfo={layoutUserInfo} onLogout={handleLogout}>
  {/* Page content */}
</ApplicationLayout>
```

## Feature Matrix

| Feature | Primary/Secondary | University/College | Vocational | Real Estate |
|---------|------------------|-------------------|------------|-------------|
| Student Management | ✅ | ✅ | ✅ | ❌ |
| Guardian Required | ✅ | Optional | Optional | N/A |
| Pickup Approval | ✅ | ✅ | ✅ | N/A |
| Self-Checkout | ❌ | ✅ | Optional | N/A |
| Tenant Approval | N/A | N/A | N/A | ✅ |
| Grade Level | ✅ | ❌ (Programme) | ✅ (Level) | N/A |
| Class Section | ✅ | ❌ (Year) | ✅ (Group) | N/A |

## Adding New Organization Types

To add a new organization type or subcategory:

### 1. Backend Changes

**Update database enum** (`/migrations/`):
```sql
ALTER TYPE educational_institution_subcategory ADD VALUE 'NewType';
-- or
ALTER TYPE real_estate_business_subcategory ADD VALUE 'NewType';
```

**Update Rust enum** (`/src/graphql/types/education.rs` or `/src/graphql/types/real_estate.rs`):
```rust
pub enum EducationalInstitutionSubcategory {
    // ... existing values
    NewType,
}
```

### 2. Frontend Changes

**Add helper function** (`/lib/roles.ts`):
```typescript
export function isNewType(userInfo: UserInfo): boolean {
  if (!userInfo.educationalInstitutionSubcategory) return false;
  return userInfo.educationalInstitutionSubcategory.toLowerCase() === 'newtype';
}
```

**Update field labels** (`/lib/roles.ts` in `getStudentFieldLabels()`):
```typescript
if (isNewType(userInfo)) {
  return {
    gradeLevelLabel: 'Custom Label',
    classSectionLabel: 'Custom Section Label',
    shouldShowGradeLevel: true,
    shouldShowClassSection: true,
  };
}
```

**Update navigation** (`/app/components/application-layout.tsx`):
```typescript
{isNewType(userInfo) && (
  <SidebarItem href="/new-type-feature">
    New Type Feature
  </SidebarItem>
)}
```

## Best Practices

1. **Always use helper functions** from `/lib/roles.ts` instead of string comparisons
2. **Use `createLayoutUserInfo()`** when passing userInfo to ApplicationLayout
3. **Check subcategories first** before falling back to organizationType
4. **Keep field names generic** in the database (e.g., `grade_level` can store programmes)
5. **Adapt UI labels** rather than creating separate database fields for each institution type
6. **Test with multiple institution types** to ensure UI adapts correctly

## Migration Path

For existing implementations without subcategories:

1. Backend will return `null` for subcategory fields
2. Frontend helpers will gracefully fallback to organizationType checks
3. Default labels ("Level", "Section/Group") will be used
4. No data migration required - works with existing data

## Examples

### University Student Registration
```typescript
{
  firstName: "John",
  lastName: "Doe",
  studentIdNumber: "U2024001",
  gradeLevel: "Computer Science",    // Programme
  classSection: "Year 2",            // Year of Study
  enrollmentDate: "2024-09-01"
}
```

### Primary School Student Registration
```typescript
{
  firstName: "Jane",
  lastName: "Smith",
  studentIdNumber: "P2024001",
  gradeLevel: "Grade 5",              // Grade Level
  classSection: "A",                  // Class Section
  enrollmentDate: "2024-09-01"
}
```

## Related Documentation

- [Role-Based Access Control](./ROLE_BASED_ACCESS.md)
- [Backend Integration](./BACKEND_INTEGRATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
