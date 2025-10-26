# RBAC Architecture Documentation

## Overview

This document describes the complete Role-Based Access Control (RBAC) system architecture for the desktop-ui application, including how departments, staff, and roles are linked together across the frontend and backend.

## Core Concepts

### 1. **Departments** (WHERE you work)
- Organizational structure managed by administrators
- Fully customizable - create, update, delete departments
- Each department has a unique `id` (UUID)
- Staff members are assigned to departments via `department_id` foreign key
- Managed via GraphQL queries

### 2. **Roles** (WHAT you can do)
- **5 Predefined Roles** (NOT customizable):
  - `Administrator` - Full system access
  - `HRManager` - Human resources management
  - `ITAdministrator` - IT and system administration
  - `DepartmentManager` - Department-scoped management (requires `department_id`)
  - `Staff` - Basic employee access

### 3. **Permissions** (HOW MUCH you can do)
- **32 Granular Permission Fields** organized into 7 categories:
  - Organization & Settings (4 fields)
  - Staff Management (8 fields)
  - Department Management (5 fields)
  - Department-Scoped Operations (3 fields)
  - IT & System Administration (5 fields)
  - Audit & Compliance (3 fields)
  - General Operations (7 fields)

---

## Database Schema

### Staff Table Fields (RBAC-related)
```sql
-- Core RBAC fields
staff_role_type VARCHAR(50) -- Administrator, HRManager, ITAdministrator, DepartmentManager, Staff
department_id UUID REFERENCES departments(id) -- Links staff to department
granular_permissions JSONB -- All 32 permission fields as JSON

-- Legacy fields (maintained for backward compatibility)
designation VARCHAR(255) -- Job title (e.g., "Senior Developer")
department VARCHAR(255) -- Free-text department name (deprecated)
```

### Departments Table
```sql
id UUID PRIMARY KEY
organization_id UUID NOT NULL
account_type VARCHAR(50) -- 'business' or 'institution'
name VARCHAR(255) NOT NULL
description TEXT
manager_id UUID REFERENCES staff(id) -- Optional department manager
parent_department_id UUID REFERENCES departments(id) -- Hierarchical structure
is_active BOOLEAN DEFAULT TRUE
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Backend Architecture

### Database Configuration (Query Routing)

The backend supports **3 database strategies** per organization:

#### 1. `kastaem_only` (Centralized)
- All data stored in Kastaem's central database
- Single source of truth
- No organization-specific database

#### 2. `own_db_only` (Decentralized)
- All data stored in organization's own database
- Complete data sovereignty
- Organization manages their own database

#### 3. `dual_db` (Hybrid)
- **Primary**: Organization's own database (write here first)
- **Backup**: Kastaem's database (async write for redundancy)
- Sequential writes: Primary → Async Backup
- Provides both sovereignty and backup

### Query Router Implementation

**File**: `/backend/src/auth/query_router.rs`

```rust
pub struct QueryRouter;

impl QueryRouter {
    // Get pool for read operations
    pub async fn get_pool_for_admin(
        state: &AppState,
        admin_id: Uuid,
        role: &UserRole
    ) -> Result<PgPool, actix_web::Error>

    // Get pool with dual-write support
    pub async fn get_pool_with_dual_write(
        state: &AppState,
        admin_id: Uuid,
        role: &UserRole
    ) -> Result<PoolWithDualWrite, actix_web::Error>
}

pub struct PoolWithDualWrite {
    primary: PgPool,
    backup: Option<PgPool>,
    strategy: DbStrategy,
}
```

### GraphQL RBAC System

#### Queries
**File**: `/backend/src/graphql/queries/staff_rbac.rs`

```rust
#[Object]
impl StaffRBACQuery {
    // Get staff member's RBAC role and permissions
    async fn staff_rbac_role(
        &self,
        ctx: &Context<'_>,
        staff_id: String
    ) -> Result<Option<StaffRBACRole>>

    // Get all departments
    async fn departments(&self, ctx: &Context<'_>) -> Result<Vec<Department>>

    // Get available RBAC role types
    async fn rbac_role_types(&self, ctx: &Context<'_>) -> Result<Vec<String>>
}
```

#### Mutations
**File**: `/backend/src/graphql/mutations/staff_rbac.rs`

```rust
#[Object]
impl StaffRBACMutation {
    // Update staff member's RBAC role and permissions
    async fn update_staff_rbac_role(
        &self,
        ctx: &Context<'_>,
        input: UpdateStaffRBACInput
    ) -> Result<UpdateStaffRBACPayload>
}

#[derive(InputObject)]
pub struct UpdateStaffRBACInput {
    staff_id: String,
    staff_role_type: String, // One of 5 predefined roles
    department_id: Option<String>, // Required for DepartmentManager
    granular_permissions: String, // JSON string with all 32 fields
}
```

#### Dual-Write Pattern Example

```rust
// PRIMARY write
let result = update_institution_staff_rbac(
    pool_with_dual.primary(),
    staff_id_uuid,
    &input.staff_role_type,
    input.department_id.as_deref(),
    &input.granular_permissions,
).await?;

// DUAL-WRITE: Async backup if dual_db strategy
if result && pool_with_dual.is_dual() {
    if let Some(backup_pool) = pool_with_dual.backup() {
        let backup_pool = backup_pool.clone();
        let staff_id_clone = staff_id_uuid;
        let role_type_clone = input.staff_role_type.clone();
        let dept_id_clone = input.department_id.clone();
        let perms_clone = input.granular_permissions.clone();

        tokio::spawn(async move {
            if let Err(e) = update_institution_staff_rbac(
                &backup_pool,
                staff_id_clone,
                &role_type_clone,
                dept_id_clone.as_deref(),
                &perms_clone,
            ).await {
                eprintln!("Backup write failed: {}", e);
            }
        });
    }
}
```

---

## Frontend Architecture

### GraphQL Client
**File**: `/lib/graphql.ts`

```typescript
// Core GraphQL function with error handling
export async function graphql<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T>

// Complete permissions interface (32 fields)
export interface GranularPermissions {
  // Organization & Settings (4 fields)
  can_update_org_settings: boolean;
  can_manage_database_config: boolean;
  can_view_org_info: boolean;
  can_update_org_info: boolean;

  // Staff Management (8 fields)
  can_register_staff: boolean;
  can_update_staff_info: boolean;
  can_deactivate_staff: boolean;
  can_view_staff_list: boolean;
  can_view_staff_details: boolean;
  can_assign_roles: boolean;
  can_manage_permissions: boolean;
  can_reset_staff_passwords: boolean;

  // Department Management (5 fields)
  can_create_departments: boolean;
  can_update_departments: boolean;
  can_delete_departments: boolean;
  can_view_departments: boolean;
  can_assign_department_managers: boolean;

  // Department-Scoped Operations (3 fields)
  can_view_department_staff: boolean;
  can_update_department_staff: boolean;
  can_approve_department_requests: boolean;

  // IT & System Administration (5 fields)
  can_manage_integrations: boolean;
  can_view_system_logs: boolean;
  can_manage_security_settings: boolean;
  can_configure_backups: boolean;
  can_manage_api_keys: boolean;

  // Audit & Compliance (3 fields)
  can_view_audit_logs: boolean;
  can_export_reports: boolean;
  can_view_compliance_data: boolean;

  // General Operations (7 fields)
  can_create: boolean;
  can_update: boolean;
  can_approve: boolean;
  can_delete: boolean;
  can_write: boolean;
  can_read: boolean;
  can_publish: boolean;
}

// Type-safe GraphQL functions
export async function getStaffRBACRole(staffId: string): Promise<StaffRBACRole | null>
export async function getDepartments(): Promise<Department[]>
export async function updateStaffRBACRole(input: UpdateStaffRBACInput): Promise<UpdateStaffRBACPayload>
```

### UI Pages

#### 1. Staff RBAC Roles Page
**File**: `/app/staff/[id]/roles/page.tsx`

**Features**:
- Radio button selection for role (one of 5 predefined roles)
- Department dropdown (shown when DepartmentManager selected)
- Auto-populates 32 permissions based on role selection
- Uses GraphQL for fetching and updating

**Key Code**:
```typescript
// Default permissions for each role (32 fields each)
const defaultPermissions: Record<StaffRoleType, GranularPermissions> = {
  Administrator: { /* all 32 fields = true */ },
  HRManager: { /* 18 true, 14 false */ },
  ITAdministrator: { /* 11 true, 21 false */ },
  DepartmentManager: { /* 9 true, 23 false */ },
  Staff: { /* 2 true, 30 false */ },
};

// When role changes, update permissions
useEffect(() => {
  if (selectedRole && defaultPermissions[selectedRole]) {
    setPermissions(defaultPermissions[selectedRole]);
  }
}, [selectedRole]);

// Save with GraphQL mutation
const handleSave = async () => {
  await updateStaffRBACRole({
    staffId,
    staffRoleType: selectedRole,
    departmentId: selectedDepartmentId || undefined,
    granularPermissions: JSON.stringify(permissions),
  });
};
```

#### 2. Staff Edit Page (Employment Information)
**File**: `/app/staff/[id]/edit/page.tsx`

**Features**:
- Fetches departments via GraphQL
- Department dropdown using `department_id` (UUID reference)
- Maintains legacy `department` text field for backward compatibility
- Uses TanStack Query for caching

**Key Code**:
```typescript
// Fetch departments with GraphQL
const { data: departments } = useQuery<Department[]>({
  queryKey: ['departments'],
  queryFn: async () => await getDepartments(),
  enabled: !!userInfo,
});

// Form data includes both legacy and new fields
const [formData, setFormData] = useState({
  designation: '',
  department: '', // Legacy free-text field
  department_id: '', // New RBAC field (UUID)
});

// Department dropdown
<Select
  name="department_id"
  value={formData.department_id}
  onChange={handleSelectChange}
>
  <option value="">Select a department</option>
  {departments?.map((dept) => (
    <option key={dept.id} value={dept.id}>
      {dept.name}
      {dept.isDefault && ' (Default)'}
    </option>
  ))}
</Select>
```

#### 3. Departments Management Page
**File**: `/app/departments/page.tsx`

**Features**:
- Full CRUD for departments (Create, Read, Update, Delete)
- Cannot delete default departments
- Shows staff count per department
- Uses GraphQL for all operations

---

## Data Flow: Linking Everything Together

### Scenario 1: Creating a New Staff Member with RBAC

**Step 1: Register Staff** (existing functionality)
- Admin creates staff account via `/app/staff/register`
- Staff record created with basic info
- Default role: `Staff`
- Default permissions: minimal (only `can_read` and `can_view_org_info`)

**Step 2: Assign Department**
- Navigate to `/app/staff/[id]/edit`
- Select department from dropdown (pulled from GraphQL `getDepartments`)
- Update sends `department_id` (UUID) to backend
- Backend stores reference in `staff.department_id` column

**Step 3: Assign Role & Permissions**
- Navigate to `/app/staff/[id]/roles`
- Select role (e.g., "DepartmentManager")
- If DepartmentManager: select which department to manage
- System auto-populates 32 permissions based on role
- Save triggers GraphQL mutation `updateStaffRBACRole`
- Backend updates:
  - `staff.staff_role_type` = "DepartmentManager"
  - `staff.department_id` = selected department UUID (the department they WORK in)
  - `staff.granular_permissions` = JSON with 32 fields
  - For DepartmentManager, the mutation also stores which department they MANAGE

### Scenario 2: Department Manager Workflow

**Setup**:
- Staff member: John Doe
- Works in: "Engineering" department (`department_id = uuid-123`)
- Role: `DepartmentManager`
- Manages: "Engineering" department (same as where he works)

**Permissions**:
```json
{
  "can_view_department_staff": true,
  "can_update_department_staff": true,
  "can_approve_department_requests": true,
  "can_export_reports": true,
  "can_update": true,
  "can_approve": true,
  "can_write": true,
  "can_read": true,
  // ... rest are false
}
```

**Backend Authorization**:
```rust
// When John tries to update a staff member
if staff_role_type == "DepartmentManager" {
    // Check if target staff is in John's managed department
    if target_staff.department_id != john.managed_department_id {
        return Err("Cannot manage staff outside your department");
    }

    // Check if John has the specific permission
    if !john.permissions.can_update_department_staff {
        return Err("Insufficient permissions");
    }

    // Allow the operation
}
```

### Scenario 3: Dual-Write Database Strategy

**Organization Config**:
- Strategy: `dual_db`
- Primary: Organization's own PostgreSQL (on-premises)
- Backup: Kastaem's central database (cloud)

**Update Role Flow**:
1. Admin updates staff role via GraphQL mutation
2. Backend receives request with `AuthToken` (contains `user_id` and `role`)
3. QueryRouter determines database strategy:
   ```rust
   let pool_with_dual = QueryRouter::get_pool_with_dual_write(
       state, auth_token.user_id, &auth_token.role
   ).await?;
   ```
4. **Primary Write** (synchronous):
   ```rust
   let result = update_staff_rbac(
       pool_with_dual.primary(), // Organization's DB
       staff_id,
       role_type,
       department_id,
       permissions_json,
   ).await?;
   ```
5. **Backup Write** (asynchronous):
   ```rust
   if pool_with_dual.is_dual() {
       tokio::spawn(async move {
           update_staff_rbac(
               backup_pool, // Kastaem's DB
               staff_id,
               role_type,
               department_id,
               permissions_json,
           ).await
       });
   }
   ```
6. Frontend receives success response after primary write completes
7. Backup write happens in background (non-blocking)

---

## Migration Path

### For Existing Deployments

**Legacy Data**:
- Staff have free-text `department` field (e.g., "Engineering")
- No `department_id` (NULL)
- No `staff_role_type` (NULL or default "staff")
- No `granular_permissions` (NULL or default JSON)

**Migration Strategy**:
1. **Create Departments**:
   - Admin creates departments in `/app/departments`
   - System creates default departments if needed

2. **Link Staff to Departments**:
   - Admin edits each staff member (`/app/staff/[id]/edit`)
   - Selects department from dropdown
   - System sets `department_id` (UUID reference)
   - Legacy `department` text field remains for backward compatibility

3. **Assign Roles**:
   - Admin visits each staff member's roles page (`/app/staff/[id]/roles`)
   - Selects appropriate role
   - System sets `staff_role_type` and `granular_permissions`

**Automated Migration Script** (future enhancement):
```sql
-- Step 1: Extract unique department names from staff table
INSERT INTO departments (name, organization_id, account_type)
SELECT DISTINCT department, org_id, 'business'
FROM staff
WHERE department IS NOT NULL AND department != '';

-- Step 2: Link staff to departments
UPDATE staff s
SET department_id = d.id
FROM departments d
WHERE s.department = d.name
AND s.organization_id = d.organization_id;

-- Step 3: Set default roles and permissions
UPDATE staff
SET
    staff_role_type = 'Staff',
    granular_permissions = '{"can_read": true, "can_view_org_info": true, ...}'
WHERE staff_role_type IS NULL;
```

---

## Best Practices

### 1. **Always Use department_id for Referential Integrity**
❌ Bad:
```typescript
formData.department = "Engineering"; // Free text, no validation
```

✅ Good:
```typescript
formData.department_id = "uuid-123"; // Foreign key to departments table
```

### 2. **Use GraphQL for All RBAC Operations**
❌ Bad (old REST endpoints - now removed):
```typescript
await put(`/auth/staff/${id}/roles-permissions`, { roles, permissions });
```

✅ Good:
```typescript
await updateStaffRBACRole({
  staffId: id,
  staffRoleType: 'DepartmentManager',
  departmentId: 'uuid-123',
  granularPermissions: JSON.stringify(permissions),
});
```

### 3. **Always Include All 32 Permission Fields**
❌ Bad:
```typescript
const permissions = {
  can_read: true,
  can_write: true,
  // Missing 30 fields!
};
```

✅ Good:
```typescript
const permissions: GranularPermissions = {
  can_update_org_settings: false,
  can_manage_database_config: false,
  // ... all 32 fields explicitly defined
};
```

### 4. **Respect Database Query Routing**
All backend queries/mutations MUST use `QueryRouter`:

```rust
// ✅ Correct
let pool = QueryRouter::get_pool_for_admin(state, user_id, &role).await?;
let result = query_staff(&pool, staff_id).await?;

// ❌ Wrong - bypasses organization's database strategy
let result = query_staff(&state.db, staff_id).await?;
```

### 5. **DepartmentManager Requires department_id**
```typescript
if (selectedRole === 'DepartmentManager' && !selectedDepartmentId) {
  setError('Department Managers must be assigned to a department');
  return;
}
```

---

## Testing the Complete System

### Test Case 1: Create Department → Assign Staff → Assign Role

1. **Create Department**:
   - Go to `/app/departments`
   - Click "Create Department"
   - Name: "Customer Success"
   - Save
   - Verify department appears in list with `staffCount: 0`

2. **Edit Staff Employment Info**:
   - Go to `/app/staff`
   - Select a staff member
   - Click "Edit"
   - Change department dropdown to "Customer Success"
   - Save
   - Verify `department_id` is set in database

3. **Assign Role**:
   - From staff list, click "Manage Roles"
   - Select "DepartmentManager" role
   - Select "Customer Success" as managed department
   - Save
   - Verify GraphQL mutation succeeds with all 32 permissions

4. **Verify Links**:
   - Department page shows `staffCount: 1`
   - Staff member shows department "Customer Success"
   - Staff has DepartmentManager permissions

### Test Case 2: Dual-Write Verification

1. **Setup Organization with dual_db Strategy**:
   - Organization has `db_strategy = 'dual_db'`
   - Own database configured and connected
   - Kastaem backup database available

2. **Update Staff Role**:
   - Use GraphQL mutation to update role
   - Monitor backend logs for:
     ```
     Primary write to organization DB: SUCCESS
     Async backup write to Kastaem DB: STARTED
     Async backup write to Kastaem DB: COMPLETED
     ```

3. **Verify Both Databases**:
   - Query organization's database: role updated ✓
   - Query Kastaem's database: role updated ✓
   - Both have identical data

4. **Test Backup Failure Handling**:
   - Temporarily disconnect backup database
   - Update role again
   - Primary write succeeds ✓
   - Backup write logs error (non-blocking) ✓
   - User sees success message (not affected by backup failure)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ /departments     │  │ /staff/[id]/edit │  │ /staff/[id]  │ │
│  │                  │  │                  │  │ /roles       │ │
│  │ CRUD Departments │  │ Set department_id│  │ Assign Role  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│           └─────────────────────┴────────────────────┘         │
│                                 │                              │
│                    ┌────────────▼────────────┐                 │
│                    │   /lib/graphql.ts       │                 │
│                    │                         │                 │
│                    │  - getDepartments()     │                 │
│                    │  - getStaffRBACRole()   │                 │
│                    │  - updateStaffRBACRole()│                 │
│                    └────────────┬────────────┘                 │
│                                 │                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │ GraphQL over HTTP
                                  │
┌─────────────────────────────────▼──────────────────────────────┐
│                    BACKEND (Actix-web + Rust)                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          GraphQL Handler (/graphql endpoint)             │ │
│  └─────────────────────┬────────────────────────────────────┘ │
│                        │                                      │
│       ┌────────────────┴────────────────┐                    │
│       │                                 │                    │
│  ┌────▼─────────────┐          ┌───────▼──────────────┐     │
│  │  StaffRBACQuery  │          │  StaffRBACMutation   │     │
│  │                  │          │                      │     │
│  │ - staff_rbac_role│          │ - update_staff_rbac  │     │
│  │ - departments    │          │                      │     │
│  └────┬─────────────┘          └───────┬──────────────┘     │
│       │                                │                    │
│       └────────────────┬───────────────┘                    │
│                        │                                    │
│               ┌────────▼────────────┐                       │
│               │   QueryRouter       │                       │
│               │                     │                       │
│               │ Determines DB Pool  │                       │
│               │ Based on Strategy:  │                       │
│               │ - kastaem_only      │                       │
│               │ - own_db_only       │                       │
│               │ - dual_db           │                       │
│               └────────┬────────────┘                       │
│                        │                                    │
│       ┌────────────────┼────────────────┐                  │
│       │                │                │                  │
│  ┌────▼──────┐  ┌──────▼─────┐  ┌──────▼──────┐           │
│  │Organization│  │  Kastaem   │  │   Backup    │           │
│  │  Own DB    │  │ Central DB │  │  (Async)    │           │
│  │  (Primary) │  │            │  │             │           │
│  └────────────┘  └────────────┘  └─────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This RBAC architecture provides:

1. **Clear Separation**: Departments (where) vs Roles (what) vs Permissions (how much)
2. **Flexibility**: 3 database strategies (centralized, decentralized, hybrid)
3. **Type Safety**: Complete TypeScript/Rust type definitions with all 32 permissions
4. **Referential Integrity**: UUID-based `department_id` foreign keys
5. **GraphQL**: Modern API with type-safe queries and mutations
6. **Dual-Write Support**: Async backup writes for data redundancy
7. **UI Integration**: Dropdowns auto-populate from GraphQL queries
8. **Backward Compatibility**: Legacy `department` text field maintained
9. **Extensibility**: Easy to add new permissions or department features

All components are now properly linked and working together! 🎉
