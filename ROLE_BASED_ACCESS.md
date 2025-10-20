# Role-Based Access Control - Desktop UI

## Overview

The Kastaem Desktop UI now implements comprehensive role-based access control (RBAC) that restricts access to **Business and Institution accounts only**. Personal accounts are not permitted to use the desktop application.

## Account Type Restrictions

### Allowed Account Types
- **Business Accounts**
  - Business Administrator
  - Business Staff

- **Institution Accounts**
  - Institution Administrator
  - Institution Staff

### Rejected Account Types
- **Personal Accounts** - Completely blocked from logging in
- **Super User Accounts** - Not designed for this application

## Authentication Flow

### 1. Login Process

When a user attempts to log in, the following validation occurs:

```typescript
// LoginScreen.tsx validates user_role
if (userRoleStr.toLowerCase().includes('personal')) {
  setError('This application is only accessible to Business and Institution accounts. Personal accounts are not allowed.');
  return;
}
```

**Error Messages:**
- Personal Account: "This application is only accessible to Business and Institution accounts. Personal accounts are not allowed."
- Invalid Account: "This application is only accessible to Business and Institution accounts."

### 2. Data Stored in localStorage

After successful authentication:
- `auth_token` - JWT access token
- `refresh_token` - JWT refresh token
- `username` - User's username
- `user_email` - User's email address
- `profile_pic_url` - Profile picture URL
- **`user_role`** - Complete UserRole enum (JSON)
- **`organization_type`** - Business type or Institution category
- **`tax_identification_number`** - Organization tax ID

### 3. Dashboard Protection

Dashboard checks authentication on every load:

```typescript
// Load user info and validate
const info = loadUserInfo();
if (!info || !isAllowedUser(info.userRole)) {
  localStorage.clear();
  router.push('/login');
  return;
}
```

## User Roles Structure

### Backend UserRole Enum (Rust)

From `/Users/allanlugwiri/RustroverProjects/backend/src/auth/jwt.rs`:

```rust
pub enum UserRole {
    Personal,                      // ❌ Not allowed in desktop app
    BusinessAdministrator,         // ✅ Allowed - Full access
    BusinessStaff,                 // ✅ Allowed - Limited access
    InstitutionAdministrator,      // ✅ Allowed - Full access
    InstitutionStaff,              // ✅ Allowed - Limited access
    SuperUser(SuperUserType),      // ❌ Not allowed in desktop app
}
```

### Frontend UserRoleType Enum (TypeScript)

From `lib/roles.ts`:

```typescript
export enum UserRoleType {
  BusinessAdministrator = 'BusinessAdministrator',
  BusinessStaff = 'BusinessStaff',
  InstitutionAdministrator = 'InstitutionAdministrator',
  InstitutionStaff = 'InstitutionStaff',
  Personal = 'Personal',          // Blocked
  SuperUser = 'SuperUser',        // Blocked
}
```

## Roles and Permissions

### Staff Roles (from backend)

Staff members can have the following organizational roles:

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

### Permissions

Staff members can have the following permissions:

```typescript
interface Permissions {
  can_create?: boolean;
  can_update?: boolean;
  can_approve?: boolean;
  can_delete?: boolean;
  can_write?: boolean;
  can_read?: boolean;
  can_publish?: boolean;
}
```

## Dashboard Views

### Administrator Dashboard

**Business Administrator or Institution Administrator**

Features full access to all organization data:

- **4 Stat Cards**
  - Total Staff
  - Active Sessions
  - Departments
  - Total Revenue

- **Administrator Actions**
  - Register Staff
  - Manage Roles
  - View Reports

- **Access Level**: Full administrative control

### Staff Dashboard

**Business Staff or Institution Staff**

Features limited access based on assigned role and permissions:

- **3 Stat Cards**
  - My Tasks
  - Completed Tasks
  - My Department

- **Staff Actions**
  - View My Tasks
  - Submit Report

- **Access Level**: Restricted to assigned responsibilities

## Implementation Details

### File: `lib/roles.ts`

Utility functions for role management:

```typescript
// Parse user role from backend response
parseUserRole(userRoleData: any): UserRoleType

// Get account type from user role
getAccountType(userRole: UserRoleType): AccountType

// Check if user is an administrator
isAdministrator(userRole: UserRoleType): boolean

// Check if user is staff
isStaff(userRole: UserRoleType): boolean

// Check if user has a specific permission
hasPermission(permissions: Permissions, permission: keyof Permissions): boolean

// Check if user has a specific role
hasRole(roles: Roles, role: keyof Roles): boolean

// Load user info from localStorage
loadUserInfo(): UserInfo | null

// Check if user is allowed to access desktop app
isAllowedUser(userRole: UserRoleType): boolean
```

### File: `src-tauri/src/lib.rs`

Updated `AuthResponse` struct to include role information:

```rust
struct AuthResponse {
    success: bool,
    token: Option<String>,
    refresh_token: Option<String>,
    message: String,
    username: Option<String>,
    email: Option<String>,
    profile_pic_url: Option<String>,
    user_role: Option<serde_json::Value>,        // NEW
    organization_type: Option<String>,           // NEW
    tax_identification_number: Option<String>,   // NEW
}
```

### File: `app/components/LoginScreen.tsx`

Account type validation before login:

```typescript
// Extract user role type from the UserRole enum
const userRoleStr = typeof response.user_role === 'string'
  ? response.user_role
  : JSON.stringify(response.user_role);

// Check if user is Personal account - reject if so
if (userRoleStr.toLowerCase().includes('personal')) {
  setError('This application is only accessible to Business and Institution accounts. Personal accounts are not allowed.');
  return;
}

// Validate that user is Business or Institution account
const isBusinessOrInstitution =
  userRoleStr.toLowerCase().includes('business') ||
  userRoleStr.toLowerCase().includes('institution');

if (!isBusinessOrInstitution) {
  setError('This application is only accessible to Business and Institution accounts.');
  return;
}
```

### File: `app/dashboard/page.tsx`

Role-based UI rendering:

```typescript
const isAdmin = isAdministrator(userInfo.userRole);
const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);
const accountTypeDisplay = getAccountTypeDisplayName(userInfo.accountType);

// Conditional rendering based on role
{isAdmin && (
  <div>
    {/* Administrator view with full access */}
  </div>
)}

{isStaff(userInfo.userRole) && (
  <div>
    {/* Staff view with limited access */}
  </div>
)}
```

## Backend Integration

### Registration Endpoints

**Administrator Registration:**
```
POST /auth/register_organization_administrator
```

Registers a Business Administrator or Institution Administrator. Only one administrator per organization is allowed.

**Staff Registration:**
```
POST /auth/register_organization_staff
```

Registers staff members. Requires authentication and permission to register staff:
- Administrators can always register staff
- Staff with `is_hr && is_admin && can_create` can register staff
- Staff with `is_chief_executive_officer && can_create` can register staff

### Login Response

Desktop/Mobile login returns `TokensResponse` directly at root level:

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

## Permission Checking Examples

### Check if user can create resources

```typescript
import { hasPermission } from '@/lib/roles';

const userInfo = loadUserInfo();
if (hasPermission(userInfo.permissions, 'can_create')) {
  // Show create button
}
```

### Check if user is HR

```typescript
import { hasRole } from '@/lib/roles';

const userInfo = loadUserInfo();
if (hasRole(userInfo.roles, 'is_hr')) {
  // Show HR-specific features
}
```

### Check if user is administrator

```typescript
import { isAdministrator } from '@/lib/roles';

const userInfo = loadUserInfo();
if (isAdministrator(userInfo.userRole)) {
  // Show admin-only features
}
```

## Future Enhancements

### 1. Dynamic Permission Loading

Currently, staff roles and permissions are not loaded from the backend. Implement:

```typescript
// Fetch user permissions from backend
async function fetchUserPermissions(userId: string): Promise<{roles: Roles, permissions: Permissions}> {
  const data = await apiRequest('/graphql', {
    method: 'POST',
    body: {
      query: `
        query GetUserRolesAndPermissions($userId: ID!) {
          user(id: $userId) {
            roles
            permissions
          }
        }
      `
    }
  });
  return data.user;
}
```

### 2. Permission-Based Routing

Create route guards based on permissions:

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const userInfo = loadUserInfo();

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!isAdministrator(userInfo.userRole)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
}
```

### 3. Staff Registration Form

Implement staff registration for administrators:

```typescript
// Form for registering new staff members
// Only accessible to administrators and authorized staff
```

### 4. Role Management UI

Implement role and permission management:

```typescript
// UI for assigning roles and permissions to staff
// Only accessible to administrators
```

## Security Considerations

1. **Client-Side Validation Only**
   - Current implementation validates on the client side
   - Backend must ALSO validate permissions for all API requests
   - Never trust client-side role checks for security

2. **Token Security**
   - Tokens stored in localStorage (not secure for highly sensitive data)
   - Consider Tauri's secure storage plugin for production
   - Implement automatic token refresh

3. **Permission Enforcement**
   - Backend middleware already enforces client type (desktop vs web)
   - Backend should validate user permissions on every request
   - GraphQL resolvers should check user roles before returning data

4. **Logout Cleanup**
   - All user data is cleared from localStorage on logout
   - Backend session is terminated via logout endpoint

## Testing Checklist

### Account Type Restrictions
- [ ] Personal account login is rejected with appropriate error
- [ ] Business Administrator can log in
- [ ] Business Staff can log in
- [ ] Institution Administrator can log in
- [ ] Institution Staff can log in

### Dashboard Views
- [ ] Administrator sees full dashboard with 4 stat cards
- [ ] Administrator sees "Administrator Actions" section
- [ ] Staff sees limited dashboard with 3 stat cards
- [ ] Staff sees "My Actions" section
- [ ] Staff sees permission notice

### User Info Display
- [ ] Username displays correctly in header
- [ ] Email displays correctly in header
- [ ] Role display name shows correctly
- [ ] Organization type displays (if available)
- [ ] Tax ID badge shows (if available)
- [ ] Profile picture displays (if available)

### Security
- [ ] Personal accounts cannot bypass login check
- [ ] Dashboard redirects to login if no valid user_role
- [ ] Logout clears all localStorage data
- [ ] Backend logout endpoint is called

## Summary

The desktop application now implements comprehensive role-based access control:

✅ **Account Type Restriction** - Only Business and Institution accounts allowed
✅ **Role Detection** - Automatically detects user role from backend response
✅ **Dynamic Dashboard** - Different views for administrators vs staff
✅ **Permission System** - Infrastructure ready for permission-based features
✅ **Security** - Multiple validation layers to prevent unauthorized access

The foundation is now in place to build out role-specific features and implement fine-grained permission controls throughout the application.
