# Real Estate Tenant Management Guide

## Overview
This guide provides comprehensive information for property administrators on managing tenant lifecycle, statuses, and best practices within the system.

---

## Tenant Status Lifecycle

### 1. Pending Move-In 🔵
**When to use:**
- Tenant has signed the lease agreement
- Move-in date is scheduled but hasn't occurred yet
- All documentation and deposits have been collected

**What happens:**
- Unit status automatically set to "occupied" (reserved for this tenant)
- No other tenants can be registered to this unit
- Tenant can begin pre-registering visitors if enabled
- Rent charges typically don't apply until status changes to "Active"

**Next steps:**
- Once tenant physically moves in, change status to "Active"

---

### 2. Active 🟢
**When to use:**
- Tenant has moved into the unit
- Actively living in and paying rent for the unit
- Full access to all services and facilities

**What happens:**
- Unit remains "occupied"
- Rent charges apply
- Full visitor management access
- Pre-registration capabilities (if enabled)
- Emergency contact information is active

**Typical duration:**
- Throughout the lease period while tenant is in good standing

---

### 3. Suspended 🟡
**When to use:**
- Temporary suspension for lease violations
- Non-payment of rent after grace period
- Pending resolution of disputes
- Security or safety concerns

**What happens:**
- Unit status remains "occupied"
- Tenant retains rights to the unit
- Visitor access may be restricted
- Can be reactivated once issues are resolved
- Historical record maintained

**Action required:**
- Document reason for suspension
- Set timeline for resolution
- Monitor situation
- Either reactivate to "Active" or escalate to "Terminated"

---

### 4. Inactive ⚪
**When to use:**
- Tenant on extended leave/vacation
- Temporary subletting situations
- Medical leave or temporary relocation
- Not actively occupying but maintains lease

**What happens:**
- Unit status remains "occupied"
- Unit still assigned to tenant
- Limited or no visitor access
- Rent obligations depend on lease terms
- Can return to "Active" status

**Best practices:**
- Confirm expected return date
- Document reason for inactive status
- Set reminders to check status

---

### 5. Terminated 🔴
**When to use:**
- Lease has ended (expired or early termination)
- Tenant has permanently moved out
- Unit has been inspected and cleared
- All final payments settled

**What happens automatically:**
- ✅ Unit status changes to "available"
- ✅ Unit can now accept new tenant registrations
- ✅ Tenant record preserved for history
- ✅ No more visitor access

**Before terminating:**
- [ ] Conduct move-out inspection
- [ ] Collect all keys and access cards
- [ ] Settle final rent and utility payments
- [ ] Process security deposit refund/deductions
- [ ] Update unit condition notes

**After terminating:**
- Tenant data remains in system for:
  - Historical reporting
  - Financial records
  - Reference checks
  - Legal/compliance requirements

---

## Unit Status Automation

The system automatically manages unit availability based on tenant status:

| Tenant Status | Unit Status | Can Register New Tenant? |
|--------------|-------------|-------------------------|
| Pending Move-In | Occupied | ❌ No |
| Active | Occupied | ❌ No |
| Suspended | Occupied | ❌ No |
| Inactive | Occupied | ❌ No |
| Terminated | Available | ✅ Yes |

---

## Best Practices

### Data Integrity
- **Never delete tenant records** - use status changes instead
- All tenant history is preserved for reporting and compliance
- Status changes are logged with timestamps

### Status Change Workflow

**New Tenant Registration:**
1. Register tenant with "Pending Move-In" status (default)
2. Unit automatically becomes "occupied"
3. On actual move-in date, change to "Active"

**Handling Payment Issues:**
1. First warning: Keep as "Active", send payment reminder
2. After grace period: Change to "Suspended"
3. Document suspension reason
4. If resolved: Return to "Active"
5. If unresolved: Escalate to "Terminated" with proper legal process

**Tenant Moving Out:**
1. Receive move-out notice
2. Schedule inspection
3. Conduct walk-through inspection
4. Settle all financial matters
5. Change status to "Terminated"
6. Unit becomes available for new tenant

### Visitor Management
- **Active tenants**: Full visitor pre-registration and approval access
- **Pending Move-In tenants**: Can pre-register expected visitors
- **Suspended tenants**: Limited or no visitor access (configurable)
- **Inactive tenants**: Limited visitor access
- **Terminated tenants**: No visitor access

---

## Common Scenarios

### Scenario 1: New Tenant Moving In
```
1. Register tenant → Status: Pending Move-In
2. Tenant physically moves in → Change to: Active
3. Throughout lease → Keep as: Active
4. Tenant gives notice → Keep as: Active until move-out
5. Tenant moves out → Change to: Terminated
```

### Scenario 2: Late Rent Payment
```
1. Current status: Active
2. Rent overdue → Send reminder (keep as Active)
3. Beyond grace period → Change to: Suspended
4. Payment received → Change back to: Active
5. Unresolved → Follow legal process → Terminated
```

### Scenario 3: Extended Vacation
```
1. Current status: Active
2. Tenant notifies of 3-month absence → Change to: Inactive
3. Tenant returns → Change back to: Active
```

### Scenario 4: Trying to Register Multiple Tenants
```
❌ System will prevent registering new tenant if unit has:
   - Active tenant
   - Pending Move-In tenant
   - Suspended tenant

✅ Only allowed when:
   - Previous tenant is Terminated
   - Unit shows as Available
```

---

## Reporting & Analytics

Tenant status data enables:
- Occupancy rate calculations
- Revenue forecasting
- Tenant retention metrics
- Average tenancy duration
- Suspension/termination reasons analysis

---

## Security & Compliance

- All status changes are logged with timestamps and user information
- Tenant personal data protected according to data privacy regulations
- Historical records maintained for legal and tax requirements
- Access to tenant management restricted to authorized administrators

---

## Troubleshooting

**Q: Can't register new tenant - unit shows as occupied**
- Check if existing tenant status is Active, Pending Move-In, or Suspended
- Terminate existing tenant first if they've moved out

**Q: Accidentally set wrong status**
- Simply change to the correct status - all changes are logged
- Previous status information is preserved in logs

**Q: Tenant not showing in list**
- Check property filter - tenant must belong to selected property
- All statuses are now visible (not just Active)
- Refresh the page if data seems stale

**Q: Unit not showing as available after terminating tenant**
- System automatically updates unit status to "available"
- If issue persists, check backend logs
- Verify tenant status was successfully updated to "Terminated"

---

## Support

For additional assistance:
- Contact system administrator
- Check backend logs for detailed error messages
- Review property and unit configuration settings

---

**Document Version:** 1.0
**Last Updated:** December 7, 2025
**Applies to:** Real Estate Module - Tenant Management
