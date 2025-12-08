# Status Management Design - Real Estate Module

**Date:** December 8, 2025
**Status:** ✅ Implemented

---

## Overview

This document outlines the simplified status management design that eliminates conflicts between Unit Status and Tenant Status by clearly separating concerns.

---

## Design Principle

**Tenant lifecycle drives unit occupancy. Maintenance is the only manual unit status change.**

---

## Status Management Rules

### Unit Management (Simplified)

**Manual Status Changes:**
- ✅ `available` ↔ `under_maintenance` (Toggle only)
- ❌ Cannot manually set `occupied` or `reserved`

**Status Change Rules:**
| Current Status | Action Available | Result | Condition |
|----------------|------------------|--------|-----------|
| `available` | Mark for Maintenance | `under_maintenance` | Always allowed |
| `under_maintenance` | Complete Maintenance | `available` | Always allowed |
| `occupied` | ❌ No action | - | Must terminate tenant first |
| `reserved` | ❌ No action | - | Must cancel reservation first |

**UI Changes:**
- Button renamed: "Change Status" → **"Maintenance"**
- Dialog title: "Unit Maintenance"
- Only shows maintenance toggle when appropriate
- Provides clear guidance when unit is occupied/reserved

---

### Tenant Management (Complete Control)

**All Tenant Status Changes:**
- ✅ `pending_move_in` → Register new tenant
- ✅ `active` → Tenant is living in unit
- ✅ `inactive` → Temporarily inactive
- ✅ `suspended` → Privileges suspended
- ✅ `terminated` → Lease ended

**Automatic Unit Status Updates:**

#### When Tenant is Registered/Activated:
```
Tenant: pending_move_in → active
Unit:   available → occupied (automatic)
```

#### When Tenant is Terminated:
```
Tenant: active → terminated
Unit:   occupied → available (automatic)
```

#### When Tenant is Suspended:
```
Tenant: active → suspended
Unit:   occupied (stays occupied - tenant still has lease)
```

---

## Status Flow Diagrams

### Normal Tenant Lifecycle

```
┌─────────────┐
│   Unit      │
│  Available  │
└──────┬──────┘
       │ (Tenant registered)
       ↓
┌─────────────┐     ┌─────────────────┐
│   Unit      │ ←── │   Tenant        │
│  Occupied   │     │   Active        │
└──────┬──────┘     └─────────────────┘
       │ (Tenant terminated)
       ↓
┌─────────────┐     ┌─────────────────┐
│   Unit      │     │   Tenant        │
│  Available  │     │   Terminated    │
└─────────────┘     └─────────────────┘
```

### Maintenance Workflow

```
┌─────────────┐
│   Unit      │
│  Available  │
└──────┬──────┘
       │ (Manual: Mark for maintenance)
       ↓
┌─────────────┐
│   Unit      │
│Under Maint. │
└──────┬──────┘
       │ (Manual: Complete maintenance)
       ↓
┌─────────────┐
│   Unit      │
│  Available  │
└─────────────┘
```

### Maintenance Needed While Occupied

```
┌─────────────┐     ┌─────────────────┐
│   Unit      │     │   Tenant        │
│  Occupied   │     │   Active        │
└──────┬──────┘     └────────┬────────┘
       │                     │
       │ 1. Go to Tenant Management
       │                     ↓
       │              ┌──────────────────┐
       │              │   Tenant         │
       │              │   Terminated     │
       │              └──────────────────┘
       ↓ (Automatic)
┌─────────────┐
│   Unit      │
│  Available  │
└──────┬──────┘
       │ 2. Return to Unit Management
       ↓ (Manual: Mark for maintenance)
┌─────────────┐
│   Unit      │
│Under Maint. │
└─────────────┘
```

---

## Benefits of This Design

### 1. **No Conflicts**
- Impossible to have conflicting statuses
- Unit status automatically reflects tenant presence
- Manual intervention only for maintenance

### 2. **Clear Separation of Concerns**
- **Unit Management**: Physical maintenance only
- **Tenant Management**: All tenant lifecycle operations

### 3. **Simplified UX**
- Users always know where to go for each operation
- Fewer decisions = less confusion
- Clear error messages guide users

### 4. **Business Logic Alignment**
- Matches real-world property management
- Tenant presence determines occupancy
- Maintenance is separate from occupancy

### 5. **Prevents User Errors**
- Can't mark occupied unit as available
- Can't mark available unit as occupied (without tenant)
- Can't do maintenance on occupied unit

---

## Implementation Details

### Files Modified
- `/app/dashboard/real-estate/units/page.tsx`
  - Simplified status dialog to maintenance toggle only
  - Added contextual messages based on unit status
  - Renamed button from "Change Status" to "Maintenance"

### Backend Requirements
To fully implement this design, the backend should:

1. **Auto-update unit status when tenant status changes:**
   ```rust
   // When tenant is activated
   if new_tenant_status == TenantStatus::Active {
       update_unit_status(tenant.unit_id, UnitStatus::Occupied).await?;
   }

   // When tenant is terminated
   if new_tenant_status == TenantStatus::Terminated {
       update_unit_status(tenant.unit_id, UnitStatus::Available).await?;
   }
   ```

2. **Validate unit status changes:**
   ```rust
   // Prevent manual occupancy changes
   if new_unit_status == UnitStatus::Occupied || new_unit_status == UnitStatus::Reserved {
       return Err("Cannot manually set occupancy status. Use Tenant Management.");
   }

   // Prevent maintenance on occupied unit
   if new_unit_status == UnitStatus::UnderMaintenance {
       let tenant = get_tenant_by_unit(unit_id).await?;
       if tenant.is_some() && tenant.unwrap().status == TenantStatus::Active {
           return Err("Cannot mark occupied unit for maintenance. Terminate tenant first.");
       }
   }
   ```

---

## User Guidance

### To Perform Maintenance on Vacant Unit:
1. Navigate to **Unit Management**
2. Click **"Maintenance"** button on available unit
3. Click **"Mark as Under Maintenance"**
4. After maintenance, click **"Maintenance"** again
5. Click **"Mark as Available"**

### To Perform Maintenance on Occupied Unit:
1. Navigate to **Tenant Management**
2. Find tenant and click **"Change Status"**
3. Terminate the tenant
4. Unit automatically becomes **available**
5. Navigate to **Unit Management**
6. Follow vacant unit maintenance steps above

### To Register New Tenant:
1. Navigate to **Tenant Management**
2. Click **"Register Tenant"**
3. Fill in tenant details and select unit
4. Unit automatically becomes **occupied** when tenant is activated

---

## Testing Checklist

- [x] Unit maintenance toggle works when unit is available
- [x] Maintenance button shows appropriate message when unit is occupied
- [x] Maintenance button shows appropriate message when unit is reserved
- [x] Cannot manually mark unit as occupied
- [x] Cannot manually mark unit as reserved
- [ ] Backend auto-updates unit when tenant is activated (requires backend changes)
- [ ] Backend auto-updates unit when tenant is terminated (requires backend changes)
- [ ] Backend prevents maintenance on occupied unit (requires backend validation)

---

## Future Enhancements

### Optional Improvements:
1. **Maintenance History Tracking**
   - Log when unit goes into/out of maintenance
   - Track maintenance duration
   - Record maintenance notes

2. **Scheduled Maintenance**
   - Allow scheduling maintenance in advance
   - Send notifications to tenants
   - Block new tenant registration during scheduled maintenance

3. **Bulk Maintenance Operations**
   - Mark multiple vacant units for maintenance
   - Useful for building-wide maintenance

---

## Summary

This simplified design eliminates status conflicts by:
- Making tenant lifecycle drive unit occupancy automatically
- Restricting manual unit status changes to maintenance only
- Providing clear guidance when actions can't be performed
- Aligning system behavior with real-world property management

**Result:** Cleaner UX, no conflicts, less confusion, and better alignment with business processes.

---

**Document Version:** 1.0
**Last Updated:** December 8, 2025
**Implementation Status:** ✅ Frontend Complete | ⏳ Backend Changes Recommended
