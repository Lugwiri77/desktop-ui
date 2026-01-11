# Organization-Specific UI Adaptation Guide

## Overview

The desktop-ui application dynamically adapts its user interface based on the organization type, providing tailored features and workflows for different industries.

---

## Table of Contents

1. [Organization Type Detection](#1-organization-type-detection)
2. [Educational Institutions](#2-educational-institutions)
3. [Religious Organizations](#3-religious-organizations)
4. [Real Estate Businesses](#4-real-estate-businesses)
5. [General Businesses](#5-general-businesses)
6. [Navigation Sidebar Adaptation](#6-navigation-sidebar-adaptation)
7. [Payment & Finance UI Adaptation](#7-payment--finance-ui-adaptation)
8. [Implementation Examples](#8-implementation-examples)
9. [Adding New Organization Types](#9-adding-new-organization-types)

---

## 1. Organization Type Detection

### Storage Mechanism

Organization type is stored in **localStorage** after successful login:

```typescript
interface UserInfo {
  accountType: 'Business' | 'Institution' | 'Personal';
  organizationType?: string;  // e.g., "EducationalInstitution", "Church", "RealEstateBusiness"

  // Educational institution specific
  educationalInstitutionSubcategory?:
    | 'PrimarySchool'
    | 'SecondarySchool'
    | 'University'
    | 'College'
    | 'VocationalSchool'
    | 'SpecialEducation'
    | 'LanguageSchool'
    | 'OnlineLearningPlatform';

  // Real estate specific
  realEstateBusinessSubcategory?:
    | 'ResidentialRealEstate'
    | 'CommercialRealEstate';
}
```

### Helper Functions

**File: `lib/roles.ts`**

```typescript
// Check if organization is educational
export function isEducationInstitution(
  accountType: string,
  organizationType?: string
): boolean {
  return accountType === 'Institution' &&
         organizationType === 'EducationalInstitution';
}

// Check if organization is church/religious
export function isReligiousOrganization(
  organizationType?: string
): boolean {
  return organizationType?.toLowerCase().includes('church') ||
         organizationType?.toLowerCase().includes('religious') ||
         organizationType?.toLowerCase().includes('mosque') ||
         organizationType?.toLowerCase().includes('temple');
}

// Check if organization is real estate
export function isRealEstateBusiness(
  userInfo: UserInfo
): boolean {
  return !!userInfo.realEstateBusinessSubcategory;
}

// More specific checks
export function isPrimaryOrSecondarySchool(userInfo: UserInfo): boolean;
export function isUniversityOrCollege(userInfo: UserInfo): boolean;
export function isVocationalSchool(userInfo: UserInfo): boolean;
export function isResidentialRealEstate(userInfo: UserInfo): boolean;
export function isCommercialRealEstate(userInfo: UserInfo): boolean;
```

---

## 2. Educational Institutions

### Supported Subcategories

1. **Primary School** (Ages 5-12)
2. **Secondary School** (Ages 13-18)
3. **University** (Ages 18+)
4. **College** (Ages 18+)
5. **Vocational School** (Ages 16+)
6. **Special Education** (All ages)
7. **Language School** (All ages)
8. **Online Learning Platform** (All ages)

### Institution-Specific Features

#### A. Student Management

**Varies by subcategory:**

| Feature | Primary | Secondary | University | Vocational | Special Ed | Online |
|---|---|---|---|---|---|---|
| **Guardian Required** | ✓ | ✓ | ✗ | Conditional | ✓ | ✗ |
| **Pickup/Dropoff** | ✓ | Optional | ✗ | ✗ | ✓ | ✗ |
| **Next of Kin Only** | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| **Class Assignment** | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| **Course Enrollment** | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| **IEP Plans** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Online Engagement** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

**Example:**
```typescript
// Student registration form adapts based on institution type
function getStudentFieldLabels(userInfo: UserInfo) {
  if (isPrimaryOrSecondarySchool(userInfo)) {
    return {
      contactLabel: 'Guardian',
      requiredContacts: true,
      pickupEnabled: true,
      fields: ['gradeLevel', 'classSection', 'parentPhone'],
    };
  }

  if (isUniversityOrCollege(userInfo)) {
    return {
      contactLabel: 'Next of Kin',
      requiredContacts: false,
      pickupEnabled: false,
      fields: ['programme', 'yearOfStudy', 'studentId'],
    };
  }

  // ... other types
}
```

#### B. School Fees System

**Pages:**
- `/school-fees/` - Fee collection dashboard
- `/school-fees/structure/create/` - Fee structure by grade
- `/school-fees/bulk-invoice/` - Bulk invoice generation

**Key Features:**
- Fee statistics (collected, pending, overdue)
- Grade-level fee structures
- Student-wise fee tracking
- Bulk invoice generation
- Arrears management

**UI Access Control:**
```typescript
// Only shown for educational institutions
if (isEducationInstitution(info.accountType, info.organizationType)) {
  <Link href="/school-fees">School Fees</Link>
}
```

#### C. Academic Features

**Primary/Secondary Only:**
- `/education/timetable` - Class timetables
- `/education/online-diary` - Student diary (Primary only)

**All Educational:**
- `/education/classes` - Class management (Admin only)
- `/education/library` - Library system

---

## 3. Religious Organizations

### Supported Types

- Churches (Christian)
- Mosques (Islamic)
- Temples (Hindu/Buddhist)
- Synagogues (Jewish)
- General Religious Organizations

### Church/Religious-Specific Features

#### A. Giving Management

**Pages:**
- `/church-giving/` - Giving dashboard
- `/church-giving/campaigns/` - Campaign management
- `/church-giving/reports/` - Giving reports

**Giving Types:**

```typescript
enum GivingType {
  TITHE = 'tithe',                      // 10% of income
  GENERAL_OFFERING = 'general_offering', // Regular offering
  BUILDING_FUND = 'building_fund',       // Capital projects
  MISSIONS = 'missions',                 // Missionary work
  THANKSGIVING = 'thanksgiving',         // Special offerings
  BENEVOLENCE = 'benevolence',           // Helping members
}
```

**Key Features:**
- Anonymous giving support
- Member contribution tracking
- Campaign management
- Transparent reporting
- QR code giving (planned)
- SMS tithe reminders (planned)

**UI Access Control:**
```typescript
// Only shown for religious organizations
const isChurch =
  info.organizationType?.toLowerCase().includes('church') ||
  info.organizationType?.toLowerCase().includes('religious');

if (isChurch) {
  <Link href="/church-giving">Church Giving</Link>
}
```

#### B. Member Management

**Features specific to religious organizations:**
- Family units (households)
- Member roles (Pastor, Elder, Deacon, Member)
- Small group/cell group management
- Event attendance tracking
- Ministry involvement

---

## 4. Real Estate Businesses

### Supported Subcategories

1. **Residential Real Estate**
   - Apartments
   - Gated Communities
   - Townhouses

2. **Commercial Real Estate**
   - Office Spaces
   - Retail Spaces
   - Mixed-Use Properties

### Real Estate-Specific Features

#### A. Property Management

**Pages:**
- `/dashboard/real-estate/properties/` - Property listing (Admin)
- `/dashboard/real-estate/units/` - Unit management (Admin)
- `/dashboard/real-estate/tenants/` - Tenant management (Admin)

**Property Types:**
```typescript
enum PropertyType {
  RESIDENTIAL_APARTMENT = 'residential_apartment',
  RESIDENTIAL_GATED_COMMUNITY = 'residential_gated_community',
  RESIDENTIAL_TOWNHOUSE = 'residential_townhouse',
  COMMERCIAL_OFFICE = 'commercial_office',
  COMMERCIAL_RETAIL = 'commercial_retail',
  COMMERCIAL_MIXED_USE = 'commercial_mixed_use',
  INDUSTRIAL_WAREHOUSE = 'industrial_warehouse',
  INDUSTRIAL_FACTORY = 'industrial_factory',
}
```

#### B. Tenant Management

**Features:**
- Tenant registration and approval
- Move-in/move-out tracking
- Lease management
- Rent payment history
- Security deposit tracking

**Tenant Approval Workflow:**
```typescript
enum TenantStatus {
  PENDING = 'pending',         // Application submitted
  APPROVED = 'approved',       // Landlord approved
  ACTIVE = 'active',          // Currently occupying
  MOVED_OUT = 'moved_out',    // Lease ended
  REJECTED = 'rejected',       // Application rejected
}
```

#### C. Visitor Pre-Registration

**Pages:**
- `/dashboard/real-estate/pre-registrations/` - Pre-registration list
- `/dashboard/real-estate/approvals/` - Tenant approval for visitors

**Features:**
- QR code generation for pre-registered visitors
- OTP-based approval system
- Tenant notification for visitor arrivals
- Security guard access control

**Workflow:**
1. Tenant pre-registers visitor
2. System generates QR code
3. Visitor presents QR code at gate
4. Security scans QR code
5. System sends OTP to tenant
6. Tenant approves via OTP
7. Visitor granted access

#### D. Parking Management

**Pages:**
- `/dashboard/real-estate/parking/` - Parking space management

**Features:**
- Parking space allocation
- Visitor parking tracking
- Reserved vs. general parking
- Parking violations

#### E. Rent Automation

**Pages:**
- `/property-management/rent-automation/` - Automated rent billing

**Features:**
- Monthly rent invoice generation
- Rent collection tracking
- Arrears management
- Late fee application
- Tenant rent history

**UI Access Control:**
```typescript
// Only shown for real estate businesses
if (userInfo.realEstateBusinessSubcategory) {
  // Show real estate navigation section
  <NavSection title="Property Management">
    <Link href="/dashboard/real-estate/properties">Properties</Link>
    <Link href="/dashboard/real-estate/tenants">Tenants</Link>
    <Link href="/property-management/rent-automation">Rent Automation</Link>
  </NavSection>
}
```

---

## 5. General Businesses

### Supported Business Types

- Retail
- Wholesale
- Manufacturing
- Services
- Technology/Software
- Healthcare
- Hospitality
- Other

### General Business Features

**Standard Features:**
- Generic invoice management
- Payment account management
- Staff management
- Document library
- Wallet (planned)
- Expense tracking (planned)

**No Organization-Specific UI** - Uses generic payment and finance features.

---

## 6. Navigation Sidebar Adaptation

### Sidebar Structure by Organization Type

**File: `app/components/application-layout.tsx`**

#### A. Educational Institutions

```tsx
<NavSection title="Education">
  {isAdministrator && (
    <NavLink href="/education/classes" icon={AcademicCapIcon}>
      Classes
    </NavLink>
  )}

  {(isPrimaryOrSecondarySchool(userInfo)) && (
    <NavLink href="/education/timetable" icon={CalendarIcon}>
      Timetable
    </NavLink>
  )}

  <NavLink href="/education/library" icon={BookOpenIcon}>
    Library
  </NavLink>

  {userInfo.educationalInstitutionSubcategory === 'PrimarySchool' && (
    <NavLink href="/education/online-diary" icon={DocumentTextIcon}>
      Online Diary
    </NavLink>
  )}
</NavSection>
```

#### B. Religious Organizations

```tsx
{isReligiousOrganization(userInfo.organizationType) && isAdministrator && (
  <NavSection title="Finance">
    <NavLink href="/church-giving" icon={BanknotesIcon}>
      Church Giving
    </NavLink>
  </NavSection>
)}
```

#### C. Real Estate Businesses

```tsx
{userInfo.realEstateBusinessSubcategory && (
  <NavSection title="Property Management">
    {isAdministrator && (
      <>
        <NavLink href="/dashboard/real-estate/properties">
          Properties
        </NavLink>
        <NavLink href="/dashboard/real-estate/units">
          Units
        </NavLink>
        <NavLink href="/dashboard/real-estate/tenants">
          Tenants
        </NavLink>
      </>
    )}

    {(isAdministrator || userInfo.staffRole === 'SecurityGuard') && (
      <>
        <NavLink href="/dashboard/real-estate/pre-registrations">
          Pre-Registrations
        </NavLink>
        <NavLink href="/dashboard/real-estate/parking">
          Parking
        </NavLink>
      </>
    )}

    <NavLink href="/dashboard/real-estate/approvals">
      Approvals
    </NavLink>
  </NavSection>
)}
```

#### D. General Businesses

```tsx
<NavSection title="Finance">
  <NavLink href="/payments" icon={BanknotesIcon}>
    Payments
  </NavLink>
  <NavLink href="/payments/invoices" icon={DocumentTextIcon}>
    Invoices
  </NavLink>
</NavSection>
```

---

## 7. Payment & Finance UI Adaptation

### Organization-Specific Payment Pages

| Organization Type | Payment Pages | Special Features |
|---|---|---|
| **Educational** | School Fees, Payments, Invoices | Grade-level fees, bulk invoicing, term reports |
| **Religious** | Church Giving, Payments | Anonymous giving, tithe tracking, campaigns |
| **Real Estate** | Rent Automation, Payments | Monthly rent billing, security deposits, arrears |
| **General** | Payments, Invoices | Generic invoicing, expense tracking |

### Access Control Pattern

```typescript
// School Fees - Educational only
useEffect(() => {
  if (!isEducationInstitution(info.accountType, info.organizationType)) {
    router.push('/payments');
    return;
  }
  setUserInfo(info);
}, [router]);

// Church Giving - Religious only
useEffect(() => {
  const isChurch =
    info.organizationType?.toLowerCase().includes('church') ||
    info.organizationType?.toLowerCase().includes('religious');

  if (!isChurch) {
    router.push('/payments');
    return;
  }
  setUserInfo(info);
}, [router]);

// Rent Automation - Real Estate only
useEffect(() => {
  if (!info.realEstateBusinessSubcategory) {
    router.push('/payments');
    return;
  }
  setUserInfo(info);
}, [router]);
```

### Currency Adaptation

Currently hardcoded to **KES (Kenyan Shillings)**.

**Planned multi-currency support:**
```typescript
function getOrganizationCurrency(
  countryCode: string,
  organizationType: string
): string {
  // Default currency by country
  const currencyMap = {
    'KE': 'KES',
    'UG': 'UGX',
    'TZ': 'TZS',
    'US': 'USD',
    'GB': 'GBP',
  };
  return currencyMap[countryCode] || 'USD';
}
```

---

## 8. Implementation Examples

### Example 1: Adding a New Feature for Schools

Let's say we want to add a "Report Card" feature for schools only.

**Step 1: Create the page**
```tsx
// app/education/report-cards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';
import { loadUserInfo, isEducationInstitution } from '@/lib/roles';

export default function ReportCardsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();

    // Only allow educational institutions
    if (!isEducationInstitution(info.accountType, info.organizationType)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  if (!userInfo) return null;

  return (
    <ApplicationLayout userInfo={userInfo}>
      <Heading>Report Cards</Heading>
      {/* Your report card UI */}
    </ApplicationLayout>
  );
}
```

**Step 2: Add to navigation**
```tsx
// app/components/application-layout.tsx

{isEducationInstitution(userInfo.accountType, userInfo.organizationType) && (
  <NavSection title="Education">
    {/* ... existing links ... */}

    <NavLink href="/education/report-cards" icon={DocumentChartBarIcon}>
      Report Cards
    </NavLink>
  </NavSection>
)}
```

### Example 2: Adding Church Event Management

**Step 1: Create the page**
```tsx
// app/church-events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';
import { loadUserInfo, isReligiousOrganization } from '@/lib/roles';

export default function ChurchEventsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);

  useEffect() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();

    // Only allow religious organizations
    if (!isReligiousOrganization(info.organizationType)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  if (!userInfo) return null;

  return (
    <ApplicationLayout userInfo={userInfo}>
      <Heading>Church Events</Heading>
      {/* Your event management UI */}
    </ApplicationLayout>
  );
}
```

**Step 2: Add to navigation**
```tsx
// app/components/application-layout.tsx

{isReligiousOrganization(userInfo.organizationType) && (
  <NavSection title="Church Management">
    <NavLink href="/church-giving">Church Giving</NavLink>

    <NavLink href="/church-events" icon={CalendarDaysIcon}>
      Events
    </NavLink>
  </NavSection>
)}
```

---

## 9. Adding New Organization Types

### Step 1: Define Organization Type

**File: `lib/roles.ts`**

```typescript
export function isHealthcareProvider(userInfo: UserInfo): boolean {
  return userInfo.accountType === 'Business' &&
         userInfo.organizationType === 'HealthcareProvider';
}

// Add specific healthcare subcategories
export function isHospital(userInfo: UserInfo): boolean {
  return isHealthcareProvider(userInfo) &&
         userInfo.healthcareSubcategory === 'Hospital';
}

export function isClinic(userInfo: UserInfo): boolean {
  return isHealthcareProvider(userInfo) &&
         userInfo.healthcareSubcategory === 'Clinic';
}
```

### Step 2: Update UserInfo Interface

```typescript
interface UserInfo {
  // ... existing fields ...

  // Healthcare-specific
  healthcareSubcategory?:
    | 'Hospital'
    | 'Clinic'
    | 'Pharmacy'
    | 'Laboratory'
    | 'DentalClinic';
}
```

### Step 3: Create Healthcare-Specific Features

```tsx
// app/healthcare/appointments/page.tsx
export default function AppointmentsPage() {
  useEffect(() => {
    const info = loadUserInfo();

    if (!isHealthcareProvider(info)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, []);

  // ... implementation
}
```

### Step 4: Add to Navigation

```tsx
// app/components/application-layout.tsx

{isHealthcareProvider(userInfo) && (
  <NavSection title="Healthcare">
    <NavLink href="/healthcare/patients">
      Patients
    </NavLink>
    <NavLink href="/healthcare/appointments">
      Appointments
    </NavLink>
    <NavLink href="/healthcare/prescriptions">
      Prescriptions
    </NavLink>
  </NavSection>
)}
```

### Step 5: Add Healthcare-Specific Payments

```tsx
// app/healthcare-billing/page.tsx
export default function HealthcareBillingPage() {
  useEffect(() => {
    if (!isHealthcareProvider(info)) {
      router.push('/payments');
      return;
    }
    setUserInfo(info);
  }, []);

  return (
    <div>
      {/* Insurance claims, patient billing, consultation fees */}
    </div>
  );
}
```

---

## 10. Testing Organization-Specific Features

### Test Cases by Organization Type

#### Educational Institutions
```typescript
describe('School Fees - Educational Only', () => {
  it('should allow access for educational institutions', () => {
    const userInfo = {
      accountType: 'Institution',
      organizationType: 'EducationalInstitution',
      educationalInstitutionSubcategory: 'PrimarySchool',
    };

    const canAccess = isEducationInstitution(
      userInfo.accountType,
      userInfo.organizationType
    );

    expect(canAccess).toBe(true);
  });

  it('should deny access for non-educational organizations', () => {
    const userInfo = {
      accountType: 'Business',
      organizationType: 'RetailBusiness',
    };

    const canAccess = isEducationInstitution(
      userInfo.accountType,
      userInfo.organizationType
    );

    expect(canAccess).toBe(false);
  });
});
```

#### Religious Organizations
```typescript
describe('Church Giving - Religious Only', () => {
  it('should allow access for churches', () => {
    const userInfo = {
      organizationType: 'Church',
    };

    const canAccess = isReligiousOrganization(userInfo.organizationType);

    expect(canAccess).toBe(true);
  });

  it('should allow access for religious organizations', () => {
    const userInfo = {
      organizationType: 'ReligiousOrganization',
    };

    const canAccess = isReligiousOrganization(userInfo.organizationType);

    expect(canAccess).toBe(true);
  });
});
```

---

## 11. Best Practices

### DO's ✓

1. **Always check organization type before rendering organization-specific features**
   ```typescript
   if (isEducationInstitution(...)) {
     return <SchoolFeesComponent />;
   }
   ```

2. **Use helper functions from `lib/roles.ts`**
   ```typescript
   // Good
   if (isPrimaryOrSecondarySchool(userInfo)) { ... }

   // Bad
   if (userInfo.educationalInstitutionSubcategory === 'PrimarySchool' ||
       userInfo.educationalInstitutionSubcategory === 'SecondarySchool') { ... }
   ```

3. **Redirect unauthorized users gracefully**
   ```typescript
   if (!isEducationInstitution(...)) {
     router.push('/dashboard');  // Redirect to main dashboard
     return;
   }
   ```

4. **Store organization type in localStorage after login**
   ```typescript
   localStorage.setItem('userInfo', JSON.stringify({
     organizationType: 'EducationalInstitution',
     educationalInstitutionSubcategory: 'PrimarySchool',
     // ... other fields
   }));
   ```

5. **Use conditional navigation in sidebar**
   ```typescript
   {isEducationInstitution(...) && (
     <NavLink href="/school-fees">School Fees</NavLink>
   )}
   ```

### DON'Ts ✗

1. **Don't hardcode organization checks everywhere**
   ```typescript
   // Bad
   if (userInfo.organizationType === 'EducationalInstitution') { ... }

   // Good
   if (isEducationInstitution(userInfo.accountType, userInfo.organizationType)) { ... }
   ```

2. **Don't forget to check authentication first**
   ```typescript
   // Bad
   if (isEducationInstitution(...)) { ... }

   // Good
   if (!isAuthenticated()) {
     router.push('/login');
     return;
   }
   if (isEducationInstitution(...)) { ... }
   ```

3. **Don't show features that aren't implemented for organization type**
   ```typescript
   // Don't show "Report Cards" for universities (they use grade transcripts)
   {isPrimaryOrSecondarySchool(userInfo) && (
     <NavLink href="/education/report-cards">Report Cards</NavLink>
   )}
   ```

4. **Don't mix organization-specific logic in generic components**
   ```typescript
   // Bad - Generic invoice component checking for school fees
   function InvoiceList() {
     if (isEducationInstitution(...)) {
       // School-specific logic
     }
   }

   // Good - Separate components
   function SchoolFeeInvoiceList() { ... }
   function GenericInvoiceList() { ... }
   ```

---

## 12. Troubleshooting

### Issue: Organization-Specific Page Not Showing

**Cause:** Organization type not stored in localStorage or incorrect type.

**Solution:**
```typescript
// Check localStorage
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
console.log('Organization Type:', userInfo.organizationType);
console.log('Educational Subcategory:', userInfo.educationalInstitutionSubcategory);

// Verify helper function works
import { isEducationInstitution } from '@/lib/roles';
console.log('Is Education:', isEducationInstitution(userInfo.accountType, userInfo.organizationType));
```

### Issue: Navigation Link Not Appearing

**Cause:** Conditional rendering logic incorrect.

**Solution:**
```typescript
// Check condition
console.log('Is Admin:', isAdministrator(userInfo.userRole));
console.log('Is Education:', isEducationInstitution(...));
console.log('Should Show Link:', isAdministrator(userInfo.userRole) && isEducationInstitution(...));
```

### Issue: Redirected Away from Organization-Specific Page

**Cause:** Access control check failing.

**Solution:**
```typescript
// Debug access control
useEffect(() => {
  const info = loadUserInfo();
  console.log('User Info:', info);
  console.log('Is Education:', isEducationInstitution(info.accountType, info.organizationType));

  if (!isEducationInstitution(info.accountType, info.organizationType)) {
    console.log('REDIRECTING: Not an educational institution');
    router.push('/dashboard');
    return;
  }

  setUserInfo(info);
}, [router]);
```

---

## 13. Future Enhancements

### Planned Organization Types

1. **Healthcare Providers** (Hospitals, Clinics, Pharmacies)
2. **Government Entities** (Ministries, Councils, Agencies)
3. **Non-Profit Organizations** (NGOs, Foundations, Charities)
4. **Hospitality** (Hotels, Restaurants, Resorts)
5. **Manufacturing** (Factories, Production facilities)

### Planned Features

1. **Multi-organization support** - One user managing multiple organizations
2. **Organization type switching** - UI to change organization type
3. **Custom workflow builder** - Organization-specific workflow customization
4. **Industry-specific reports** - KPIs by organization type
5. **Compliance modules** - Regulatory compliance by industry
6. **Accounting integration** - QuickBooks, Xero, Sage for each industry

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Author:** Claude Code
**Status:** Active Reference Documentation
