# Desktop UI Documentation

## Overview

This documentation provides comprehensive guides for the desktop-ui application, a multi-tenant organization management system with industry-specific features.

---

## Documentation Index

### Core Documentation

1. **[Payment Reconciliation & Wallet Best Practices](./RECONCILIATION_AND_WALLET_BEST_PRACTICES.md)**
   - Best practices for implementing wallet management
   - Reconciliation workflows for organizations
   - Organization-specific payment recommendations
   - Implementation roadmap and database schema

2. **[Organization-Specific UI Guide](./ORGANIZATION_SPECIFIC_UI_GUIDE.md)**
   - How the UI adapts to different organization types
   - Educational institutions, religious organizations, real estate
   - Navigation sidebar adaptation
   - Implementation examples and best practices

---

## Quick Start

### Understanding Organization Types

The desktop-ui application supports different organization types with tailored features:

| Organization Type | Key Features | Special Pages |
|---|---|---|
| **Educational Institutions** | Student management, school fees, timetables, library | `/school-fees`, `/education/*` |
| **Religious Organizations** | Church giving, tithe tracking, campaigns | `/church-giving/*` |
| **Real Estate Businesses** | Property management, tenant management, rent automation | `/property-management/*`, `/dashboard/real-estate/*` |
| **General Businesses** | Generic invoicing, payment management | `/payments/*`, `/invoices/*` |

### Key Concepts

#### 1. Organization Type Detection

Organization type is stored in **localStorage** after login:

```typescript
const userInfo = {
  accountType: 'Institution' | 'Business' | 'Personal',
  organizationType: 'EducationalInstitution' | 'Church' | 'RealEstateBusiness',

  // Subcategories
  educationalInstitutionSubcategory?: 'PrimarySchool' | 'University' | ...,
  realEstateBusinessSubcategory?: 'ResidentialRealEstate' | 'CommercialRealEstate',
};
```

#### 2. Helper Functions

Use helper functions from `lib/roles.ts`:

```typescript
import {
  isEducationInstitution,
  isReligiousOrganization,
  isRealEstateBusiness,
  isPrimaryOrSecondarySchool,
  isUniversityOrCollege,
} from '@/lib/roles';

// Check organization type
if (isEducationInstitution(userInfo.accountType, userInfo.organizationType)) {
  // Show school-specific features
}
```

#### 3. Conditional Rendering

Navigation and features adapt based on organization type:

```tsx
{isEducationInstitution(...) && (
  <NavLink href="/school-fees">School Fees</NavLink>
)}

{isReligiousOrganization(...) && (
  <NavLink href="/church-giving">Church Giving</NavLink>
)}

{isRealEstateBusiness(userInfo) && (
  <NavLink href="/property-management">Rent Automation</NavLink>
)}
```

---

## Current System Status

### ✅ Implemented Features

#### Payment System
- [x] Invoice-based payment model
- [x] Payment accounts (M-Pesa, Bank, Card)
- [x] Generic invoice management
- [x] Organization-specific payment pages

#### Educational Institutions
- [x] School fees management
- [x] Student management (with guardian/next-of-kin based on level)
- [x] Class management
- [x] Timetable (Primary/Secondary)
- [x] Library system
- [x] Online diary (Primary schools)

#### Religious Organizations
- [x] Church giving management
- [x] Tithe tracking
- [x] Offering types (building fund, missions, etc.)
- [x] Campaign management
- [x] Anonymous giving support

#### Real Estate
- [x] Property management
- [x] Tenant management
- [x] Visitor pre-registration
- [x] Rent automation
- [x] Parking management

### 🚧 Planned Features

#### Payment System (Phase 1-4)
- [ ] Organization wallet management
- [ ] Wallet transaction tracking
- [ ] Payment reconciliation workflows
- [ ] Multi-currency support
- [ ] Expense tracking
- [ ] Cash flow forecasting

#### Educational Institutions
- [ ] Payment plans and installments
- [ ] Report card generation
- [ ] Parent portal
- [ ] Online exam management

#### Religious Organizations
- [ ] QR code giving
- [ ] SMS tithe reminders
- [ ] Member portal
- [ ] Event management

#### Real Estate
- [ ] Lease document management
- [ ] Maintenance request system
- [ ] Tenant portal
- [ ] Landlord reporting

---

## Architecture Overview

### Frontend Structure

```
desktop-ui/
├── app/
│   ├── components/
│   │   └── application-layout.tsx    # Conditional navigation
│   ├── education/                     # Educational features
│   │   ├── classes/
│   │   ├── timetable/
│   │   └── library/
│   ├── school-fees/                   # Educational payments
│   ├── church-giving/                 # Religious payments
│   ├── property-management/           # Real estate payments
│   │   └── rent-automation/
│   ├── payments/                      # Generic payments
│   │   ├── invoices/
│   │   ├── accounts/
│   │   ├── reconciliation/           # Placeholder
│   │   └── transactions/             # Placeholder
│   └── dashboard/
│       └── real-estate/              # Real estate management
│           ├── properties/
│           ├── tenants/
│           ├── pre-registrations/
│           └── parking/
├── lib/
│   ├── roles.ts                      # Organization type helpers
│   ├── payments-api.ts               # Payment API (Invoice-based)
│   └── layout-utils.ts               # Layout helpers
├── types/
│   ├── education.ts                  # Educational types
│   └── real-estate.ts                # Real estate types
└── docs/
    ├── README.md                     # This file
    ├── RECONCILIATION_AND_WALLET_BEST_PRACTICES.md
    └── ORGANIZATION_SPECIFIC_UI_GUIDE.md
```

### Backend Structure

```
backend/
├── src/
│   ├── graphql/
│   │   ├── queries/
│   │   │   ├── payments.rs          # Payment account queries
│   │   │   └── invoices.rs          # Invoice queries
│   │   ├── types/
│   │   │   └── payments.rs          # Payment types
│   │   └── schema.rs
│   ├── models/
│   │   ├── payment_account.rs
│   │   ├── invoice.rs
│   │   └── wallet.rs               # To be implemented
│   └── database/
│       └── migrations/
```

---

## Payment System Evolution

### Current: Invoice-Based System

**Structure:**
- Payment accounts (M-Pesa, Bank, Card)
- Invoices with polymorphic issuer/recipient
- No wallet or transaction tracking

**Limitations:**
- No centralized cash position tracking
- No reconciliation with bank statements
- No expense tracking
- No cash flow visibility

### Future: Wallet + Reconciliation System

**Structure:**
- Organization wallet (central ledger)
- Wallet transactions (all money movement)
- Reconciliation module (match with bank statements)
- Expense tracking and categorization

**Benefits:**
- Real-time cash position
- Automated reconciliation
- Expense analytics
- Cash flow forecasting
- Multi-currency support

**See:** [RECONCILIATION_AND_WALLET_BEST_PRACTICES.md](./RECONCILIATION_AND_WALLET_BEST_PRACTICES.md) for full details.

---

## Organization Type Comparison

| Feature | Educational | Religious | Real Estate | General Business |
|---|---|---|---|---|
| **Primary Use Case** | Student & fee management | Giving & member management | Property & tenant management | Generic business operations |
| **Payment Focus** | School fees by grade level | Tithe & offerings by type | Rent collection by property | Generic invoicing |
| **Key Entities** | Students, Guardians, Classes | Members, Families, Giving | Properties, Units, Tenants | Customers, Invoices |
| **Special Workflows** | Fee structure, Bulk invoicing | Anonymous giving, Campaigns | Tenant approval, Pre-registration | - |
| **Reporting** | Term reports, Arrears | Giving reports, Transparency | Rent collection, Occupancy | Financial reports |
| **Compliance** | Government audit, Board reporting | Tax receipts, Transparency | Landlord reporting, Tax | Standard accounting |

---

## Development Guidelines

### Adding Organization-Specific Features

1. **Define helper function** in `lib/roles.ts`
   ```typescript
   export function isMyOrganizationType(userInfo: UserInfo): boolean {
     return userInfo.organizationType === 'MyType';
   }
   ```

2. **Create organization-specific page**
   ```tsx
   // app/my-feature/page.tsx
   useEffect(() => {
     if (!isMyOrganizationType(userInfo)) {
       router.push('/dashboard');
       return;
     }
   }, []);
   ```

3. **Add to navigation** in `app/components/application-layout.tsx`
   ```tsx
   {isMyOrganizationType(userInfo) && (
     <NavLink href="/my-feature">My Feature</NavLink>
   )}
   ```

### Best Practices

✅ **DO:**
- Use helper functions from `lib/roles.ts`
- Check authentication before organization type
- Redirect unauthorized users gracefully
- Use conditional navigation
- Test with different organization types

❌ **DON'T:**
- Hardcode organization type checks
- Mix organization-specific logic in generic components
- Show features that aren't implemented
- Forget to update navigation when adding pages

**See:** [ORGANIZATION_SPECIFIC_UI_GUIDE.md](./ORGANIZATION_SPECIFIC_UI_GUIDE.md) Section 11 for full best practices.

---

## Testing

### By Organization Type

```typescript
// Educational institutions
describe('School Fees', () => {
  it('allows access for educational institutions', () => {
    const userInfo = {
      accountType: 'Institution',
      organizationType: 'EducationalInstitution',
    };
    expect(isEducationInstitution(...)).toBe(true);
  });
});

// Religious organizations
describe('Church Giving', () => {
  it('allows access for religious organizations', () => {
    const userInfo = { organizationType: 'Church' };
    expect(isReligiousOrganization(...)).toBe(true);
  });
});

// Real estate
describe('Rent Automation', () => {
  it('allows access for real estate businesses', () => {
    const userInfo = {
      realEstateBusinessSubcategory: 'ResidentialRealEstate',
    };
    expect(isRealEstateBusiness(userInfo)).toBe(true);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: Organization-specific page not showing

**Solution:** Check localStorage for organization type
```javascript
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
console.log('Organization Type:', userInfo.organizationType);
```

#### Issue: Navigation link not appearing

**Solution:** Verify conditional rendering logic
```typescript
console.log('Is Admin:', isAdministrator(userInfo.userRole));
console.log('Is Education:', isEducationInstitution(...));
```

#### Issue: Redirected away from page

**Solution:** Check access control in useEffect
```typescript
console.log('User Info:', userInfo);
console.log('Access Check:', isEducationInstitution(...));
```

**See:** [ORGANIZATION_SPECIFIC_UI_GUIDE.md](./ORGANIZATION_SPECIFIC_UI_GUIDE.md) Section 12 for more troubleshooting.

---

## Roadmap

### Q1 2025 (Current)
- [x] Fix payment system to match backend schema
- [x] Document organization-specific UI adaptation
- [x] Document wallet and reconciliation best practices
- [ ] Implement Phase 1: Core Wallet (2-3 weeks)

### Q2 2025
- [ ] Implement Phase 2: Basic Reconciliation (3-4 weeks)
- [ ] Add multi-currency support
- [ ] Enhance school fees with payment plans

### Q3 2025
- [ ] Implement Phase 3: Organization-Specific Features (4-6 weeks)
- [ ] Add QR giving for churches
- [ ] Add lease management for real estate

### Q4 2025
- [ ] Implement Phase 4: Advanced Features (6-8 weeks)
- [ ] Machine learning for reconciliation
- [ ] Accounting system integration
- [ ] Mobile app integration

---

## Contributing

### Documentation Updates

When adding new features:

1. Update relevant documentation
2. Add examples to organization-specific guide
3. Update this README if adding new organization types
4. Add troubleshooting tips if needed

### Code Changes

When modifying organization-specific features:

1. Test with all relevant organization types
2. Ensure helper functions are used consistently
3. Update navigation if adding pages
4. Add access control checks

---

## Resources

### External Documentation

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

### Internal Documentation

- [Reconciliation & Wallet Best Practices](./RECONCILIATION_AND_WALLET_BEST_PRACTICES.md) - Comprehensive guide for implementing wallet and reconciliation features
- [Organization-Specific UI Guide](./ORGANIZATION_SPECIFIC_UI_GUIDE.md) - Detailed guide on UI adaptation by organization type

---

## Support

For questions or issues:

1. Check documentation first
2. Review troubleshooting section
3. Check example implementations
4. Contact development team

---

**Documentation Version:** 1.0
**Last Updated:** 2025-12-28
**Maintained By:** Development Team
**Status:** Active & Maintained
