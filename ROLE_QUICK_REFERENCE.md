# Role-Based Access - Quick Reference

## User Roles

| Role | Code | Access Level | Allowed? |
|------|------|--------------|----------|
| Business Administrator | `BusinessAdministrator` | Full | ✅ Yes |
| Business Staff | `BusinessStaff` | Limited | ✅ Yes |
| Institution Administrator | `InstitutionAdministrator` | Full | ✅ Yes |
| Institution Staff | `InstitutionStaff` | Limited | ✅ Yes |
| Personal | `Personal` | None | ❌ Blocked |
| Super User | `SuperUser` | None | ❌ Blocked |

## Quick Code Examples

### Check if user is administrator

```typescript
import { isAdministrator, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
if (isAdministrator(userInfo.userRole)) {
  // Show admin-only content
}
```

### Check if user is staff

```typescript
import { isStaff, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
if (isStaff(userInfo.userRole)) {
  // Show staff-only content
}
```

### Check user permissions

```typescript
import { hasPermission, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
if (hasPermission(userInfo.permissions, 'can_create')) {
  // Show create button
}
```

### Check user roles

```typescript
import { hasRole, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
if (hasRole(userInfo.roles, 'is_hr')) {
  // Show HR features
}
```

### Get user role display name

```typescript
import { getUserRoleDisplayName, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
const roleName = getUserRoleDisplayName(userInfo.userRole);
// Returns: "Business Administrator", "Business Staff", etc.
```

### Get account type

```typescript
import { getAccountType, loadUserInfo } from '@/lib/roles';

const userInfo = loadUserInfo();
const accountType = getAccountType(userInfo.userRole);
// Returns: AccountType.Business or AccountType.Institution
```

## Available Permissions

```typescript
interface Permissions {
  can_create?: boolean;    // Can create new resources
  can_update?: boolean;    // Can update existing resources
  can_approve?: boolean;   // Can approve requests
  can_delete?: boolean;    // Can delete resources
  can_write?: boolean;     // Can write/edit content
  can_read?: boolean;      // Can read content
  can_publish?: boolean;   // Can publish content
}
```

## Available Organizational Roles

```typescript
interface Roles {
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
}
```

## UserInfo Structure

```typescript
interface UserInfo {
  username: string;                  // User's username
  email: string;                     // User's email
  userRole: UserRoleType;           // BusinessAdministrator, BusinessStaff, etc.
  accountType: AccountType;         // Business or Institution
  organizationType?: string;        // E.g., "Technology", "Education"
  roles?: Roles;                    // Staff organizational roles
  permissions?: Permissions;        // Staff permissions
  profilePicUrl?: string;           // Profile picture URL
  taxId?: string;                   // Organization tax ID
}
```

## localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `auth_token` | string | JWT access token |
| `refresh_token` | string | JWT refresh token |
| `username` | string | User's username |
| `user_email` | string | User's email |
| `user_role` | JSON string | UserRole enum (parsed) |
| `organization_type` | string | Business type or Institution category |
| `tax_identification_number` | string | Organization tax ID |
| `profile_pic_url` | string | Profile picture URL |

## Common Patterns

### Protected Component

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUserInfo, isAdministrator } from '@/lib/roles';

export default function AdminOnlyComponent() {
  const router = useRouter();

  useEffect(() => {
    const userInfo = loadUserInfo();
    if (!userInfo || !isAdministrator(userInfo.userRole)) {
      router.push('/dashboard');
    }
  }, [router]);

  return <div>Admin-only content</div>;
}
```

### Conditional Rendering

```typescript
import { loadUserInfo, isAdministrator } from '@/lib/roles';

export default function Dashboard() {
  const userInfo = loadUserInfo();
  const isAdmin = isAdministrator(userInfo.userRole);

  return (
    <div>
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <StaffDashboard />
      )}
    </div>
  );
}
```

### Permission-Based Button

```typescript
import { loadUserInfo, hasPermission } from '@/lib/roles';

export default function ActionButton() {
  const userInfo = loadUserInfo();
  const canCreate = hasPermission(userInfo.permissions, 'can_create');

  if (!canCreate) return null;

  return (
    <button onClick={handleCreate}>
      Create New Item
    </button>
  );
}
```

## Error Messages

### Login Errors

| Error | Meaning |
|-------|---------|
| "This application is only accessible to Business and Institution accounts. Personal accounts are not allowed." | User tried to login with Personal account |
| "This application is only accessible to Business and Institution accounts." | User role is not recognized as Business or Institution |
| "Invalid response from server. Please try again." | Backend didn't return user_role |

### Dashboard Errors

If user is redirected from dashboard to login, it means:
1. No authentication token found
2. No user_role found in localStorage
3. User role is not allowed (Personal or SuperUser)

## Testing Quick Reference

### Test Account Types

```bash
# Business Administrator - Should login ✅
Email: admin@businesscompany.com

# Business Staff - Should login ✅
Email: staff@businesscompany.com

# Institution Administrator - Should login ✅
Email: admin@institution.edu

# Institution Staff - Should login ✅
Email: staff@institution.edu

# Personal Account - Should be rejected ❌
Email: user@personal.com
```

### Test Dashboard Views

1. **Administrator View**:
   - 4 stat cards (Total Staff, Active Sessions, Departments, Total Revenue)
   - "Administrator Actions" section
   - Full access buttons

2. **Staff View**:
   - 3 stat cards (My Tasks, Completed, My Department)
   - "My Actions" section
   - Limited access with permission notice

## Integration with Backend

### Backend Response Format

```json
{
  "message": "Login successful",
  "username": "johndoe",
  "email": "john.doe@company.com",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user_role": "BusinessAdministrator",
  "organization_type": "Technology",
  "phone_number": "+1234567890",
  "tax_identification_number": "123456789",
  "profile_pic_url": "/media-files/profile_pics/...",
  "logo_url": null
}
```

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | No | Login with email/username and password |
| `/auth/logout` | POST | Yes | Logout and clear session |
| `/auth/register_organization_administrator` | POST | No | Register business/institution administrator |
| `/auth/register_organization_staff` | POST | Yes | Register staff (requires admin or HR permissions) |

## Next Steps

1. **Fetch Staff Permissions**: Implement API call to load staff roles and permissions from backend
2. **Route Guards**: Add permission-based route protection
3. **Staff Registration UI**: Build form for administrators to register staff
4. **Role Management**: Implement UI for assigning roles and permissions

## Documentation Files

- **[ROLE_BASED_ACCESS.md](./ROLE_BASED_ACCESS.md)** - Comprehensive RBAC documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Full implementation details
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Backend integration guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide
- **[CLIENT_TYPES.md](./CLIENT_TYPES.md)** - Client type system explanation
