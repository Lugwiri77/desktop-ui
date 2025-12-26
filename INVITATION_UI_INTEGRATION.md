# Invitation System UI Integration Guide

This guide explains how to integrate the user invitation system into your desktop UI pages using Catalyst UI components.

## Overview

The invitation system consists of:
- **API Layer**: `lib/invitation-api.ts` - GraphQL mutations and helper functions
- **UI Components**:
  - `InvitationDialog` - Modal for sending invitations
  - `InvitationStatsCard` - Statistics dashboard card

## Real Estate Implementation Example

The invitation system has been successfully integrated into the real estate tenant management page. Below is the actual implementation from `/app/dashboard/real-estate/tenants/page.tsx`.

### Key Features Implemented

1. **App Status Column**: Shows which tenants have registered on the mobile app
2. **Conditional Invite Button**: Only displays for tenants without app accounts
3. **Status Badges**: Visual indicators for app registration status
4. **Invitation Dialog**: Full-featured modal for sending invitations

### Code Implementation

**1. Add Imports**:
```typescript
import { InvitationDialog } from '@/app/components/InvitationDialog';
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
```

**2. Add State Management**:
```typescript
const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
const [tenantToInvite, setTenantToInvite] = useState<Tenant | null>(null);
```

**3. Add "App Status" Column to Table**:
```typescript
<TableHeader>App Status</TableHeader>
```

**4. Display Status Badge in Table Cell**:
```typescript
<TableCell>
  {tenant.personalAccountId ? (
    <Badge color="lime" className="flex items-center gap-1">
      <CheckCircleIcon className="h-3 w-3" />
      Has App
    </Badge>
  ) : (
    <Badge color="zinc">No App Account</Badge>
  )}
</TableCell>
```

**5. Add Invite Button in Actions Column**:
```typescript
{!tenant.personalAccountId && (
  <Button
    color="indigo"
    onClick={() => {
      setTenantToInvite(tenant);
      setIsInvitationDialogOpen(true);
    }}
  >
    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
    Invite to App
  </Button>
)}
```

**6. Add InvitationDialog Component**:
```typescript
{tenantToInvite && (
  <InvitationDialog
    isOpen={isInvitationDialogOpen}
    onClose={() => {
      setIsInvitationDialogOpen(false);
      setTenantToInvite(null);
    }}
    organizationType="business"
    organizationId={userInfo.businessId}
    inviteeType="tenant"
    inviteeId={tenantToInvite.id}
    inviteeTableName="tenants"
    inviteeName={`${tenantToInvite.firstName} ${tenantToInvite.lastName}`}
    inviteeEmail={tenantToInvite.email}
    inviteePhone={tenantToInvite.phoneNumber}
    onSuccess={() => {
      queryClient.invalidateQueries({ queryKey: ['tenants', selectedPropertyId] });
    }}
  />
)}
```

## Quick Start

### 1. Import Components

```typescript
import { InvitationDialog } from '@/app/components/InvitationDialog';
import { InvitationStatsCard } from '@/app/components/InvitationStats';
import { createInvitation, getInvitationStats } from '@/lib/invitation-api';
```

### 2. Add Invitation Button to Lists

#### Example: Property Management - Tenant List (Generic Template)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/button';
import { InvitationDialog } from '@/app/components/InvitationDialog';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';

export default function TenantsPage() {
  const [invitationDialog, setInvitationDialog] = useState<{
    isOpen: boolean;
    tenant: any | null;
  }>({ isOpen: false, tenant: null });

  const openInvitationDialog = (tenant: any) => {
    setInvitationDialog({ isOpen: true, tenant });
  };

  return (
    <div>
      {/* Tenant List */}
      {tenants.map((tenant) => (
        <div key={tenant.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <p className="font-semibold">{tenant.firstName} {tenant.lastName}</p>
            <p className="text-sm text-gray-600">Unit: {tenant.unitNumber}</p>
            <p className="text-sm text-gray-600">{tenant.email || tenant.phoneNumber}</p>
          </div>

          {/* Invite Button - Only show if tenant has no personal account */}
          {!tenant.personalAccountId && (
            <Button
              plain
              onClick={() => openInvitationDialog(tenant)}
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Invite to App
            </Button>
          )}
        </div>
      ))}

      {/* Invitation Dialog */}
      {invitationDialog.tenant && (
        <InvitationDialog
          isOpen={invitationDialog.isOpen}
          onClose={() => setInvitationDialog({ isOpen: false, tenant: null })}
          organizationType="business"
          organizationId={userInfo.businessId}
          inviteeType="tenant"
          inviteeId={invitationDialog.tenant.id}
          inviteeTableName="tenants"
          inviteeName={`${invitationDialog.tenant.firstName} ${invitationDialog.tenant.lastName}`}
          inviteeEmail={invitationDialog.tenant.email}
          inviteePhone={invitationDialog.tenant.phoneNumber}
          onSuccess={() => {
            // Optionally refresh tenant list to show updated status
            loadTenants();
          }}
        />
      )}
    </div>
  );
}
```

#### Example: Education - Student List

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/button';
import { InvitationDialog } from '@/app/components/InvitationDialog';

export default function StudentsPage() {
  const [invitationDialog, setInvitationDialog] = useState<{
    isOpen: boolean;
    student: any | null;
  }>({ isOpen: false, student: null });

  return (
    <div>
      {/* Student List */}
      {students.map((student) => (
        <div key={student.id}>
          <p>{student.fullName}</p>

          {/* Invite Student */}
          {!student.personalAccountId && (
            <Button onClick={() => setInvitationDialog({ isOpen: true, student })}>
              Invite Student
            </Button>
          )}
        </div>
      ))}

      {/* Invitation Dialog */}
      {invitationDialog.student && (
        <InvitationDialog
          isOpen={invitationDialog.isOpen}
          onClose={() => setInvitationDialog({ isOpen: false, student: null })}
          organizationType="institution"
          organizationId={userInfo.institutionId}
          inviteeType="student"
          inviteeId={invitationDialog.student.id}
          inviteeTableName="institution_students"
          inviteeName={invitationDialog.student.fullName}
          inviteeEmail={invitationDialog.student.email}
          inviteePhone={invitationDialog.student.phoneNumber}
        />
      )}
    </div>
  );
}
```

### 3. Add Statistics Dashboard

Add the statistics card to your dashboard page:

```typescript
import { InvitationStatsCard } from '@/app/components/InvitationStats';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other Statistics Cards */}
      <PropertyStatsCard />
      <RevenueStatsCard />

      {/* Invitation Statistics */}
      <InvitationStatsCard
        organizationType="business"
        organizationId={userInfo.businessId}
      />
    </div>
  );
}
```

## Component Props Reference

### InvitationDialog

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Callback when dialog closes |
| `organizationType` | `'business' \| 'institution'` | Yes | Organization type |
| `organizationId` | `string` | Yes | Organization UUID |
| `inviteeType` | `InviteeType` | Yes | Type of user being invited |
| `inviteeId` | `string` | Yes | Invitee UUID |
| `inviteeTableName` | `string` | Yes | Database table name |
| `inviteeName` | `string` | Yes | Full name of invitee |
| `inviteeEmail` | `string?` | No | Email address (optional) |
| `inviteePhone` | `string` | Yes | Phone number |
| `onSuccess` | `() => void` | No | Callback after successful send |

### InvitationStatsCard

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `organizationType` | `'business' \| 'institution'` | Yes | Organization type |
| `organizationId` | `string` | Yes | Organization UUID |

## Invitee Types

The system supports these invitee types:

- `tenant` - Real estate tenants
- `student` - Educational institution students
- `guardian` - Student guardians/parents
- `church_member` - Religious institution members
- `employee` - Business employees
- `staff` - Institution staff
- `customer` - Business customers
- `visitor` - Frequent visitors
- `other` - Generic invitees

## API Functions

### createInvitation()

Send a new invitation:

```typescript
import { createInvitation } from '@/lib/invitation-api';

const result = await createInvitation({
  organizationType: 'business',
  organizationId: 'uuid',
  inviteeType: 'tenant',
  inviteeId: 'uuid',
  inviteeTableName: 'tenants',
  inviteeName: 'John Doe',
  inviteeEmail: 'john@example.com',
  inviteePhone: '+254700000000',
  sendEmail: true,
  sendSms: false,
  validForDays: 7,
});

console.log(result.registrationUrl); // Share this URL
```

### resendInvitation()

Resend an existing invitation:

```typescript
import { resendInvitation } from '@/lib/invitation-api';

const result = await resendInvitation('invitation-uuid');
```

### cancelInvitation()

Cancel a pending invitation:

```typescript
import { cancelInvitation } from '@/lib/invitation-api';

await cancelInvitation('invitation-uuid', 'Invitation no longer needed');
```

### getInvitationStats()

Get organization statistics:

```typescript
import { getInvitationStats } from '@/lib/invitation-api';

const stats = await getInvitationStats('business', 'org-uuid');
console.log(`Acceptance rate: ${stats.acceptanceRate}%`);
```

## Integration Checklist

### Property Management Module (Real Estate)

- [x] **Add invite button to tenant list page** - `/app/dashboard/real-estate/tenants/page.tsx`
  - Added "Invite to App" button for tenants without `personalAccountId`
  - Conditionally shows "Has App" badge for tenants with app accounts
  - Integrated InvitationDialog component
- [ ] Add invite button to tenant detail page
- [ ] Show invitation status badge (pending/accepted/expired)
- [ ] Add invitation stats card to property dashboard
- [ ] Handle resend invitation for expired/bounced
- [x] **Show "Already Registered" badge for tenants with accounts**
  - Shows "Has App" green badge when tenant has `personalAccountId`
  - Shows "No App Account" gray badge otherwise

### Visitor Management

**Note**: The current visitor management system (`/app/visitors/page.tsx`) handles one-time visitors who check in and out of facilities. The `VisitorLog` model doesn't include a `personalAccountId` field. These are transient visitors, not registered users who would benefit from mobile app invitations.

**Future Enhancement**: Consider adding a "Frequent Visitors" or "Registered Visitors" table for visitors who regularly visit the facility and would benefit from having the mobile app. This table would include:
- `personal_account_id UUID` - Link to personal account
- Personal details (name, email, phone)
- Visit frequency tracking
- Pre-approval settings

Once this table is created, the invitation system can be integrated following the same pattern as tenants.

### Education Module

- [ ] Add invite button to student list page
- [ ] Add invite button to guardian management
- [ ] Add invitation stats to school dashboard
- [ ] Bulk invitation feature for class enrollment
- [ ] Parent/Guardian invitation workflow

### Features to Implement

- [ ] Bulk invitation (invite multiple users at once)
- [ ] Invitation history/log page
- [ ] Resend reminder before expiry
- [ ] Custom templates per organization
- [ ] Invitation tracking dashboard
- [ ] Export invitation report

## Best Practices

### 1. Check if User Has Account

Always check `personalAccountId` before showing invite button:

```typescript
{!tenant.personalAccountId && (
  <Button onClick={() => inviteTenant(tenant)}>
    Invite to App
  </Button>
)}
```

### 2. Show Invitation Status

Display invitation status next to users:

```typescript
{tenant.invitationStatus === 'pending' && (
  <Badge color="yellow">Invitation Pending</Badge>
)}
{tenant.invitationStatus === 'accepted' && (
  <Badge color="green">Registered</Badge>
)}
{tenant.invitationStatus === 'expired' && (
  <Badge color="red">Invitation Expired</Badge>
)}
```

### 3. Handle Errors Gracefully

Always wrap invitation calls in try/catch:

```typescript
try {
  await createInvitation(input);
  toast.success('Invitation sent successfully!');
} catch (error) {
  toast.error(`Failed to send invitation: ${error.message}`);
}
```

### 4. Provide Feedback

Show loading state and success messages:

```typescript
const [sending, setSending] = useState(false);

const handleSendInvitation = async () => {
  setSending(true);
  try {
    await createInvitation(input);
    // Show success message
  } finally {
    setSending(false);
  }
};
```

## Styling with Catalyst UI

The components are built with Catalyst UI and follow these patterns:

- **Dialogs**: Use `Dialog`, `DialogTitle`, `DialogBody`, `DialogActions`
- **Forms**: Use `Field`, `Label`, `Input`, `Checkbox`
- **Feedback**: Use `Badge` for status, `Text` for messages
- **Icons**: Use Heroicons (`@heroicons/react/20/solid`)

## Environment Variables

Ensure these are set in backend `.env`:

```bash
JWT_SECRET=your-secure-secret-key
APP_DEEP_LINK_URL=https://app.yourcompany.com
APP_STORE_URL=https://apps.apple.com/app/your-app
PLAY_STORE_URL=https://play.google.com/store/apps/details?id=your.app

# Email
MAILTRAP_API_TOKEN=your-token

# SMS (optional)
ENABLE_SMS=true
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Testing

Test the invitation flow:

1. **Create Invitation**: Click invite button for a user without an account
2. **Send via Email/SMS**: Verify delivery preferences work
3. **Copy Registration URL**: Test manual sharing
4. **Check Statistics**: Verify stats card updates
5. **Resend Invitation**: Test expiry and resend flow
6. **Mobile Registration**: Test deep link on mobile app
7. **Account Linking**: Verify account is automatically linked after registration

## Troubleshooting

### "Failed to send invitation"

- Check backend is running and GraphQL endpoint is accessible
- Verify JWT token is valid and not expired
- Check RBAC permissions for invitation creation

### "No email provided"

- Email is optional but either email or phone must be provided
- Update the invitee record with an email address

### Email/SMS not sending

- Check backend logs for delivery errors
- Verify Mailtrap/Twilio credentials in `.env`
- Check `ENABLE_SMS` environment variable

### Deep link not working

- Verify `APP_DEEP_LINK_URL` in backend `.env`
- Check mobile app deep link configuration
- Test URL format: `https://app.yourcompany.com/register?token=...`

## Support

For detailed backend documentation, see:
- `/backend/docs/USER_INVITATION_SYSTEM.md`

For GraphQL API reference:
- Backend mutations: `/backend/src/graphql/mutations/invitations.rs`
- Backend types: `/backend/src/graphql/types/invitations.rs`
