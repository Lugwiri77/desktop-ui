# Offline Mode Implementation Guide

## Overview

The desktop-ui now implements a **complete offline-first system** that works across ALL modules:
- 🏢 Real Estate (tenant management, property operations)
- 🎓 Educational Institutions (student records, attendance)
- 👥 Visitor Management (check-ins, approvals)
- 💼 Business Operations
- 👨‍💼 Staff Management

---

## Features

### ✅ What Works Offline:

1. **Read Operations** - View all cached data (properties, tenants, students, visitors, etc.)
2. **Write Operations** - Create, update, delete operations are queued
3. **Automatic Sync** - Queued operations sync automatically when connection restored
4. **Manual Sync** - Users can trigger sync manually
5. **Queue Management** - View, prioritize, and manage pending operations
6. **Network Status** - Real-time indication of online/offline state
7. **Conflict Resolution** - Smart handling of concurrent changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Action                          │
│          (Register Tenant, Update Status, etc.)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Online?        │
                    └──────────────────┘
                       │            │
                  YES  │            │  NO
                       ▼            ▼
            ┌──────────────┐  ┌──────────────┐
            │ Execute Now  │  │ Queue & Show │
            │ + Invalidate │  │ Optimistic   │
            │   Cache      │  │   Update     │
            └──────────────┘  └──────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ LocalStorage     │
                             │ Mutation Queue   │
                             └──────────────────┘
                                      │
                              (Connection Restored)
                                      ▼
                             ┌──────────────────┐
                             │  Auto-Sync       │
                             │  Process Queue   │
                             └──────────────────┘
```

---

## Usage Guide

### For Module Developers

#### Step 1: Convert Existing Mutations

**Before (Standard Mutation):**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerTenant } from '@/lib/real-estate-api';

const registerMutation = useMutation({
  mutationFn: (input: RegisterTenantInput) => registerTenant(input),
  onSuccess: () => {
    toast.success('Tenant registered');
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
  },
  onError: (error) => {
    toast.error(`Failed: ${error.message}`);
  },
});

registerMutation.mutate(formData);
```

**After (Offline-Aware Mutation):**
```typescript
import { useOfflineMutation } from '@/lib/hooks/useOfflineMutation';
import { registerTenant } from '@/lib/real-estate-api';

const registerMutation = useOfflineMutation(
  (input: RegisterTenantInput) => registerTenant(input),
  {
    module: 'real-estate',
    operation: 'registerTenant',
    priority: 'high', // high | normal | low
    invalidateKeys: ['tenants', 'units'],
    successMessage: 'Tenant registered successfully',
    errorMessage: (error) => `Failed to register: ${error.message}`,
  }
);

// Usage is exactly the same
registerMutation.mutate(formData);
```

#### Step 2: Module-Specific Examples

##### Real Estate Module

```typescript
// Register Tenant
const registerTenantMutation = useOfflineMutation(
  (input: RegisterTenantInput) => registerTenant(input),
  {
    module: 'real-estate',
    operation: 'registerTenant',
    priority: 'high',
    invalidateKeys: ['tenants', 'units', 'properties'],
    successMessage: (data) => `Tenant ${data.firstName} ${data.lastName} registered`,
  }
);

// Update Tenant Status
const updateStatusMutation = useOfflineMutation(
  (params: { tenantId: string; newStatus: TenantStatus }) =>
    updateTenantStatus(params.tenantId, params.newStatus),
  {
    module: 'real-estate',
    operation: 'updateTenantStatus',
    priority: 'normal',
    invalidateKeys: ['tenants'],
    successMessage: 'Tenant status updated',
  }
);

// Create Property
const createPropertyMutation = useOfflineMutation(
  (input: CreatePropertyInput) => createProperty(input),
  {
    module: 'real-estate',
    operation: 'createProperty',
    priority: 'high',
    invalidateKeys: ['properties'],
    successMessage: 'Property created successfully',
  }
);
```

##### Education Module

```typescript
// Mark Attendance
const markAttendanceMutation = useOfflineMutation(
  (input: AttendanceInput) => markAttendance(input),
  {
    module: 'education',
    operation: 'markAttendance',
    priority: 'high', // Attendance is time-sensitive
    invalidateKeys: ['attendance', 'students'],
    successMessage: 'Attendance marked',
  }
);

// Update Grades
const updateGradesMutation = useOfflineMutation(
  (input: GradeInput) => updateGrades(input),
  {
    module: 'education',
    operation: 'updateGrades',
    priority: 'normal',
    invalidateKeys: ['grades', 'students'],
  }
);
```

##### Visitor Management Module

```typescript
// Check In Visitor
const checkInMutation = useOfflineMutation(
  (input: CheckInInput) => checkInVisitor(input),
  {
    module: 'visitor',
    operation: 'checkInVisitor',
    priority: 'high', // Real-time security requirement
    invalidateKeys: ['visitors', 'visitor-logs'],
    successMessage: (data) => `${data.visitorName} checked in`,
  }
);

// Check Out Visitor
const checkOutMutation = useOfflineMutation(
  (visitorId: string) => checkOutVisitor(visitorId),
  {
    module: 'visitor',
    operation: 'checkOutVisitor',
    priority: 'high',
    invalidateKeys: ['visitors', 'visitor-logs'],
  }
);
```

##### Security Module

```typescript
// Resolve Security Incident
const resolveIncidentMutation = useOfflineMutation(
  ({ incidentId, resolutionNotes }: { incidentId: string; resolutionNotes: string }) =>
    resolveIncident(incidentId, resolutionNotes),
  {
    module: 'visitor',
    operation: 'resolveIncident',
    priority: 'high', // High priority - critical security operation
    invalidateKeys: ['organizationIncidents', 'securityIncidents'],
    successMessage: 'Security incident resolved successfully',
    optimisticUpdate: {
      queryKey: ['organizationIncidents'],
      updater: (oldData, variables) =>
        oldData.map((incident) =>
          incident.id === variables.incidentId
            ? { ...incident, resolved: true, resolutionNotes: variables.resolutionNotes }
            : incident
        ),
    },
  }
);

// Approve Security Staff Nomination
const approveStaffMutation = useOfflineMutation(
  approveStaffNomination,
  {
    module: 'visitor',
    operation: 'approveStaffNomination',
    priority: 'high', // High priority - security access approval
    invalidateKeys: ['pendingStaffNominations', 'securityStaff'],
    successMessage: (data) => `${data.firstName} ${data.lastName} approved`,
    optimisticUpdate: {
      queryKey: ['pendingStaffNominations'],
      updater: (oldData, variables) =>
        oldData.filter((n) => n.id !== variables.nominationId),
    },
  }
);

// Update Security Company
const updateCompanyMutation = useOfflineMutation(
  updateSecurityCompany,
  {
    module: 'visitor',
    operation: 'updateSecurityCompany',
    priority: 'normal',
    invalidateKeys: ['securityCompanies'],
    successMessage: (data) => `${data.companyName} updated successfully`,
    optimisticUpdate: {
      queryKey: ['securityCompanies'],
      updater: (oldData, variables) =>
        oldData.map((company) =>
          company.id === variables.id ? { ...company, ...variables } : company
        ),
    },
  }
);
```

---

## Priority Levels

### When to Use Each Priority:

#### **High Priority** (Processed First)
- Real-time security operations (visitor check-in/out)
- Time-sensitive data (attendance marking)
- Critical business operations (tenant registration, property creation)
- Financial transactions

#### **Normal Priority** (Default)
- Standard updates (tenant status, student info)
- Content modifications
- Settings changes
- Most CRUD operations

#### **Low Priority** (Processed Last)
- Bulk operations
- Analytics events
- Non-critical updates
- Cleanup operations

---

## Queue Management

### View Pending Operations

Users can click the floating badge to see all pending operations:

```typescript
import { OfflineQueueBadge } from '@/app/components/OfflineQueueStatus';

// Already added to root layout - shows automatically when queue > 0
```

### Manual Sync

```typescript
import { triggerManualSync } from '@/lib/offline-sync-manager';

// Trigger from anywhere in the app
function SyncButton() {
  return (
    <button onClick={triggerManualSync}>
      Sync Now
    </button>
  );
}
```

### Clear Queue (Admin Only)

```typescript
import { clearQueue, clearModuleQueue } from '@/lib/offline-queue';

// Clear entire queue
clearQueue();

// Clear only real-estate operations
clearModuleQueue('real-estate');
```

---

## Testing Offline Mode

### Method 1: Browser DevTools
```
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Test operations
5. Uncheck "Offline" to see auto-sync
```

### Method 2: Programmatic (Development Only)
```typescript
// In browser console:
if (process.env.NODE_ENV === 'development') {
  // Simulate offline
  window.navigator.onLine = false;
  window.dispatchEvent(new Event('offline'));

  // Simulate back online
  window.navigator.onLine = true;
  window.dispatchEvent(new Event('online'));
}
```

### Test Scenarios

#### Scenario 1: Basic Offline Operation
```
1. Go offline
2. Register a tenant
3. See "Queued for sync" message
4. Go online
5. See "Synced 1 change successfully"
6. Verify tenant appears in list
```

#### Scenario 2: Multiple Operations
```
1. Go offline
2. Register 3 tenants
3. Update 2 tenant statuses
4. Create 1 property
5. Go online
6. See "Synced 6 changes successfully"
7. Verify all changes applied
```

#### Scenario 3: Partial Failure
```
1. Go offline
2. Perform 5 operations
3. Go online (but simulate 2 failures)
4. See "Synced 3 changes, 2 failed"
5. Failed operations retry automatically
```

---

## Best Practices

### 1. Always Use Offline-Aware Mutations for Write Operations
```typescript
// ❌ Don't use standard useMutation for write operations
const badMutation = useMutation({
  mutationFn: registerTenant,
});

// ✅ Use useOfflineMutation
const goodMutation = useOfflineMutation(registerTenant, {
  module: 'real-estate',
  operation: 'registerTenant',
  priority: 'high',
});
```

### 2. Choose Appropriate Priority
```typescript
// ❌ Everything as high priority
priority: 'high' // Wrong for non-critical operations

// ✅ Match priority to business importance
priority: 'high'   // Critical: Check-in, attendance, financial
priority: 'normal' // Standard: Updates, status changes
priority: 'low'    // Bulk: Cleanup, analytics
```

### 3. Provide Good Error Messages
```typescript
// ❌ Generic message
errorMessage: 'Failed'

// ✅ Specific, actionable message
errorMessage: (error) =>
  `Failed to register tenant: ${error.message}. Please try again.`
```

### 4. Invalidate Relevant Caches
```typescript
// ❌ Forget to invalidate
invalidateKeys: []

// ✅ Invalidate all related caches
invalidateKeys: ['tenants', 'units', 'properties']
```

---

## Monitoring & Analytics

### Queue Statistics

```typescript
import { getQueueStats } from '@/lib/offline-queue';

const stats = getQueueStats();
console.log({
  total: stats.total,              // 15
  byPriority: stats.byPriority,    // { high: 5, normal: 8, low: 2 }
  byModule: stats.byModule,        // { 'real-estate': 10, 'visitor': 5 }
  oldest: stats.oldest,            // Date object
});
```

### Custom Events

```typescript
// Listen for queue updates
window.addEventListener('queueUpdated', (event: any) => {
  const { queue } = event.detail;
  console.log(`Queue updated: ${queue.length} operations pending`);
});
```

---

## Security Considerations

### 1. Sensitive Data
```typescript
// Don't queue sensitive operations that should fail immediately
if (operationContainsSensitiveData) {
  // Throw error instead of queuing
  throw new Error('This operation requires internet connection');
}
```

### 2. Authentication
```typescript
// All queued mutations check authentication before sync
{
  requiresAuth: true, // Default, enforces auth token
}
```

### 3. Queue Expiration
```typescript
// Mutations older than 7 days are automatically removed
// Prevents stale operations from syncing
```

---

## Troubleshooting

### Issue: Operations Not Syncing

**Check:**
1. Network is actually online (`navigator.onLine`)
2. Auth token is valid
3. Queue not empty (`getQueueStats()`)
4. No console errors

**Fix:**
```typescript
// Manual sync
triggerManualSync();

// Check queue
console.log(getQueueStats());
```

### Issue: Too Many Queued Operations

**Check:**
```typescript
const stats = getQueueStats();
if (stats.total > 50) {
  // Consider clearing old operations
  // or increasing MAX_QUEUE_SIZE
}
```

### Issue: Sync Fails Repeatedly

**Check:**
1. Backend is accessible
2. Token not expired
3. Payload is valid
4. Check `errors` array in sync result

---

## Migration Checklist

### For Each Module:

- [ ] Identify all write operations (create, update, delete)
- [ ] Convert `useMutation` to `useOfflineMutation`
- [ ] Set appropriate module name
- [ ] Set appropriate priority level
- [ ] Add cache invalidation keys
- [ ] Add success/error messages
- [ ] Test offline scenarios
- [ ] Update documentation

### Example Migration PR:

```
Title: feat(real-estate): Add offline support for tenant operations

Changes:
- ✅ Converted registerTenant mutation
- ✅ Converted updateTenantStatus mutation
- ✅ Converted createProperty mutation
- ✅ Added offline tests
- ✅ Updated module documentation

Testing:
- [x] Offline tenant registration
- [x] Offline status update
- [x] Multiple operations queue
- [x] Auto-sync on reconnect
- [x] Manual sync
```

---

## Performance Metrics

Expected performance:
- **Queue Size**: < 50 operations (configurable up to 100)
- **Sync Success Rate**: > 95%
- **Sync Duration**: < 500ms per operation
- **Cache Hit Rate**: > 80% for read operations
- **Storage Usage**: < 5MB for queue (compressed)

---

## Support

For issues or questions:
1. Check this guide first
2. Review console logs (look for 📦, 🔄, ✅, ❌ symbols)
3. Check queue status in UI
4. Review backend logs for sync errors

---

## Changelog

### v1.0.0 (2025-12-08)
- ✅ Initial offline mode implementation
- ✅ Offline queue management
- ✅ Auto-sync on reconnect
- ✅ Manual sync capability
- ✅ Network status indicators
- ✅ Queue management UI
- ✅ Multi-module support (Real Estate, Education, Visitor, Staff)
- ✅ Priority-based processing
- ✅ Comprehensive error handling
- ✅ Toast notifications
- ✅ Cache invalidation
- ✅ Queue persistence (7-day expiration)

---

**Document Version:** 1.0.0
**Last Updated:** December 8, 2025
**Applies to:** All desktop-ui modules
