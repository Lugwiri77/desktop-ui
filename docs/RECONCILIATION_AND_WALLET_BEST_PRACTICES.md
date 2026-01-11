# Payment Reconciliation & Wallet Management Best Practices

## Executive Summary

This document provides best practice recommendations for implementing payment reconciliation and wallet management features for organizations (businesses and institutions) in the desktop-ui application.

---

## 1. Current System Architecture

### Payment System Overview

The current system uses an **invoice-based payment model**:
- Payment accounts (M-Pesa, Bank, Card)
- Generic invoices with polymorphic issuer/recipient
- No wallet transaction tracking
- No reconciliation features

### Organization-Specific Payment Features

| Organization Type | Current Payment System | Missing Features |
|---|---|---|
| **Educational Institutions** | School Fees (bulk invoicing, arrears) | Payment plans, wallet, reconciliation |
| **Religious Organizations** | Church Giving (tithe, offerings, campaigns) | QR giving, SMS reminders, reconciliation |
| **Real Estate** | Rent Automation (monthly billing) | Security deposits, wallet, reconciliation |
| **General Business** | Generic Invoices | Wallet, reconciliation, expense tracking |

---

## 2. Best Practice Recommendations

### A. Wallet Management for Organizations

#### What is an Organization Wallet?

An organization wallet is a **virtual ledger** that tracks the organization's liquid cash position across multiple payment methods and accounts.

#### Recommended Wallet Structure

```typescript
interface OrganizationWallet {
  id: string;
  organizationId: string;
  organizationType: 'business' | 'institution';

  // Balances by currency
  balances: {
    currency: 'KES' | 'USD' | 'EUR';
    availableBalance: number;      // Immediately spendable
    pendingIncoming: number;       // Expected receipts
    pendingOutgoing: number;       // Scheduled payments
    totalBalance: number;          // Available + Pending
    reservedBalance: number;       // Locked for specific purposes
  }[];

  // Breakdown by account type
  accountBalances: {
    paymentAccountId: string;
    accountType: 'mpesa' | 'bank' | 'card' | 'cash';
    balance: number;
    lastReconciled: Date;
  }[];

  // Transaction limits and controls
  limits: {
    dailyWithdrawalLimit?: number;
    monthlyExpenseLimit?: number;
    approvalRequired: boolean;
    approvalThreshold?: number;
  };

  status: 'active' | 'suspended' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Wallet Transaction Types

```typescript
enum WalletTransactionType {
  // Income
  INVOICE_PAYMENT = 'invoice_payment',           // From invoices
  SCHOOL_FEE_PAYMENT = 'school_fee_payment',     // Educational
  TITHE = 'tithe',                               // Religious
  OFFERING = 'offering',                         // Religious
  RENT_PAYMENT = 'rent_payment',                 // Real Estate
  DONATION = 'donation',                         // General

  // Expenses
  SALARY_PAYMENT = 'salary_payment',
  SUPPLIER_PAYMENT = 'supplier_payment',
  UTILITY_PAYMENT = 'utility_payment',
  REFUND = 'refund',

  // Internal
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  RECONCILIATION_ADJUSTMENT = 'reconciliation_adjustment',
  BANK_CHARGES = 'bank_charges',
  MPESA_CHARGES = 'mpesa_charges',
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;

  // Source/Destination
  sourceAccountId?: string;          // Which payment account
  destinationAccountId?: string;

  // Linking to invoices/fees/giving
  invoiceId?: string;
  schoolFeePaymentId?: string;
  givingId?: string;
  rentPaymentId?: string;

  // Reconciliation tracking
  isReconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  externalReference?: string;        // Bank/M-Pesa transaction ID

  // Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  // Metadata
  description: string;
  notes?: string;
  attachments?: string[];            // Receipts, proofs

  createdAt: Date;
  createdBy: string;
}
```

---

### B. Reconciliation Best Practices

#### What is Reconciliation?

**Reconciliation** is the process of matching internal transaction records with external bank/M-Pesa statements to ensure accuracy and detect discrepancies.

#### Recommended Reconciliation Workflow

##### 1. **Daily Reconciliation** (Operations Team)

```typescript
interface DailyReconciliation {
  id: string;
  organizationId: string;
  reconciliationDate: Date;

  // Accounts being reconciled
  paymentAccounts: {
    accountId: string;
    accountType: 'mpesa' | 'bank';
    accountName: string;

    // Internal records (from wallet)
    internalBalance: number;
    internalTransactionCount: number;
    internalTransactions: WalletTransaction[];

    // External records (from bank/M-Pesa statement)
    externalBalance: number;
    externalTransactionCount: number;
    externalTransactions: ExternalTransaction[];

    // Matching results
    matchedTransactions: number;
    unmatchedInternal: number;        // In system but not in bank
    unmatchedExternal: number;        // In bank but not in system
    discrepancyAmount: number;        // Difference in balances

    status: 'matched' | 'discrepancy' | 'pending_review';
  }[];

  // Overall status
  overallStatus: 'reconciled' | 'discrepancy' | 'pending';
  reconciledBy: string;
  approvedBy?: string;
  notes?: string;

  createdAt: Date;
  completedAt?: Date;
}

interface ExternalTransaction {
  reference: string;                 // Bank/M-Pesa transaction ID
  date: Date;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  balance: number;                   // Balance after transaction

  // Matching
  isMatched: boolean;
  matchedWalletTransactionId?: string;
  matchedBy?: string;
  matchedAt?: Date;
}
```

##### 2. **Reconciliation Process Steps**

1. **Import External Statement**
   - Upload bank statement (CSV, PDF, Excel)
   - Parse transactions with date, amount, reference, description
   - Validate format and completeness

2. **Automatic Matching**
   - Match by exact amount and date (±1 day tolerance)
   - Match by reference number (if available)
   - Match by description keywords
   - Use fuzzy matching algorithms

3. **Manual Review**
   - Present unmatched transactions for review
   - Allow staff to manually link internal <-> external
   - Add notes for discrepancies
   - Create adjustment entries

4. **Approval Workflow**
   - Operations staff performs reconciliation
   - Finance manager reviews and approves
   - System updates wallet balances
   - Generate reconciliation report

5. **Exception Handling**
   ```typescript
   enum ReconciliationException {
     MISSING_INTERNAL = 'missing_internal',     // Payment received but not recorded
     MISSING_EXTERNAL = 'missing_external',     // Payment sent but not cleared
     AMOUNT_MISMATCH = 'amount_mismatch',       // Different amounts
     DUPLICATE_ENTRY = 'duplicate_entry',       // Same transaction recorded twice
     BANK_CHARGES = 'bank_charges',             // Unexpected fees
     REVERSAL = 'reversal',                     // Transaction reversed
   }

   interface ReconciliationException {
     type: ReconciliationException;
     internalTransaction?: WalletTransaction;
     externalTransaction?: ExternalTransaction;
     discrepancyAmount: number;
     resolution: 'pending' | 'resolved' | 'written_off';
     resolutionNotes?: string;
     resolvedBy?: string;
     resolvedAt?: Date;
   }
   ```

##### 3. **Month-End Reconciliation**

- Comprehensive review of all accounts
- Bank statement reconciliation
- M-Pesa statement reconciliation
- Generate financial reports
- Archive reconciliation records
- Board reporting (for institutions)

---

### C. Organization-Specific Recommendations

#### 1. Educational Institutions (Schools/Colleges/Universities)

**Wallet Features:**
- **Student Fee Wallet**: Track all fee collections
- **Scholarship Fund Wallet**: Separate ledger for scholarships
- **PTA/Alumni Fund Wallet**: Separate donor-restricted funds
- **Operating Expenses Wallet**: Day-to-day expenses

**Reconciliation Needs:**
- Daily fee collection reconciliation (critical for cash flow)
- M-Pesa reconciliation for mobile fee payments
- Bank reconciliation for direct deposits
- Term-end financial reporting to Board of Governors
- Government audit compliance (for public institutions)

**Best Practices:**
```typescript
// School-specific reconciliation
interface SchoolFeeReconciliation {
  term: 'Term1' | 'Term2' | 'Term3';
  gradeLevel: string;

  expectedCollections: number;       // Total fees billed
  actualCollections: number;         // Total received
  arrears: number;                   // Outstanding balance

  collectionsByMethod: {
    mpesa: number;
    bank: number;
    cash: number;
  };

  // Compliance
  governmentRemittance?: number;     // Capitation, levies
  nhifRemittance?: number;           // Staff health insurance
  nssfRemittance?: number;           // Staff pension
}
```

#### 2. Religious Organizations (Churches/Mosques/Temples)

**Wallet Features:**
- **General Fund Wallet**: Tithe and general offerings
- **Building Fund Wallet**: Capital project contributions
- **Missions Wallet**: Charitable work
- **Benevolence Wallet**: Helping members in need

**Reconciliation Needs:**
- Sunday/Weekly offering reconciliation
- Tithe tracking and allocation
- Donor anonymity preservation
- Transparent reporting to congregation
- Tax-deductible contribution tracking

**Best Practices:**
```typescript
// Church-specific reconciliation
interface ChurchGivingReconciliation {
  serviceDate: Date;
  serviceType: 'Sunday' | 'Midweek' | 'Special';

  offeringsByType: {
    tithe: number;
    generalOffering: number;
    buildingFund: number;
    missions: number;
    thanksgiving: number;
  };

  collectionMethod: {
    cash: number;
    mpesa: number;
    bank: number;
    qrCode: number;                  // For QR-based giving
  };

  // Transparency
  anonymousGiving: number;           // Don't track individuals
  namedGiving: number;               // For tax receipts

  // Allocation
  pastoralSalaries: number;
  utilities: number;
  missions: number;
  benevolence: number;
}
```

#### 3. Real Estate Businesses

**Wallet Features:**
- **Rent Collection Wallet**: Monthly rent income
- **Security Deposit Wallet**: Tenant deposits (restricted)
- **Maintenance Fund Wallet**: Property upkeep
- **Service Charge Wallet**: Common area expenses

**Reconciliation Needs:**
- Monthly rent collection tracking
- Tenant-by-tenant reconciliation
- Security deposit liability tracking
- Service charge allocation
- Landlord reporting (if managing properties)

**Best Practices:**
```typescript
// Real estate reconciliation
interface RentReconciliation {
  month: Date;
  propertyId: string;

  expectedRent: number;              // Sum of all unit rents
  collectedRent: number;             // Actual received
  arrears: number;                   // Overdue rent

  tenantPayments: {
    tenantId: string;
    unitNumber: string;
    rentDue: number;
    rentPaid: number;
    balance: number;
    daysOverdue: number;
  }[];

  // Expenses
  maintenanceExpenses: number;
  serviceCharges: number;
  utilities: number;

  // Net operating income
  noi: number;                       // Rent - Expenses
}
```

#### 4. General Businesses

**Wallet Features:**
- **Operating Wallet**: Day-to-day transactions
- **Receivables Wallet**: Expected invoice payments
- **Payables Wallet**: Supplier payment tracking
- **Payroll Wallet**: Employee salaries

**Reconciliation Needs:**
- Daily cash reconciliation
- Weekly bank reconciliation
- Monthly supplier statement reconciliation
- Quarterly tax remittance reconciliation

---

## 3. Implementation Roadmap

### Phase 1: Core Wallet (2-3 weeks)

**Backend:**
- [x] Create `wallet` table
- [x] Create `wallet_transactions` table
- [x] Implement wallet creation on organization setup
- [x] Implement transaction recording
- [x] Calculate wallet balances

**Frontend:**
- [ ] Create `/payments/wallet` page
- [ ] Display current wallet balance
- [ ] Show recent transactions
- [ ] Filter by transaction type
- [ ] Export transaction history

### Phase 2: Basic Reconciliation (3-4 weeks)

**Backend:**
- [ ] Create `reconciliations` table
- [ ] Create `external_transactions` table
- [ ] Implement statement upload (CSV parser)
- [ ] Automatic matching algorithm
- [ ] Manual matching API

**Frontend:**
- [ ] Create `/payments/reconciliation` page (replace placeholder)
- [ ] Upload statement interface
- [ ] Transaction matching UI
- [ ] Discrepancy resolution workflow
- [ ] Reconciliation report generation

### Phase 3: Organization-Specific Features (4-6 weeks)

**Educational:**
- [ ] School fee collection reconciliation
- [ ] Student-wise payment tracking
- [ ] Term-end financial reports

**Religious:**
- [ ] Offering reconciliation by service
- [ ] Donor anonymity support
- [ ] Transparent giving reports

**Real Estate:**
- [ ] Rent collection reconciliation
- [ ] Tenant payment history
- [ ] Security deposit tracking

**General Business:**
- [ ] Expense categorization
- [ ] Supplier payment tracking
- [ ] Cash flow forecasting

### Phase 4: Advanced Features (6-8 weeks)

- [ ] Multi-currency wallet support
- [ ] Automated reconciliation rules
- [ ] Machine learning for transaction matching
- [ ] Mobile app integration
- [ ] Email/SMS notifications for discrepancies
- [ ] Audit trail and compliance reporting
- [ ] Integration with accounting systems (QuickBooks, Xero)

---

## 4. Database Schema

### Wallet Tables

```sql
-- Organization Wallet
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    organization_type VARCHAR(50) NOT NULL,

    -- Balance by currency
    kes_balance DECIMAL(15, 2) DEFAULT 0.00,
    usd_balance DECIMAL(15, 2) DEFAULT 0.00,
    eur_balance DECIMAL(15, 2) DEFAULT 0.00,

    -- Pending amounts
    kes_pending_incoming DECIMAL(15, 2) DEFAULT 0.00,
    kes_pending_outgoing DECIMAL(15, 2) DEFAULT 0.00,

    -- Status
    status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),

    -- Transaction details
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,

    -- Source/Destination
    source_account_id UUID REFERENCES payment_accounts(id),
    destination_account_id UUID REFERENCES payment_accounts(id),

    -- Linking
    invoice_id UUID REFERENCES invoices(id),
    school_fee_payment_id UUID,
    giving_id UUID,
    rent_payment_id UUID,

    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP,
    reconciled_by UUID REFERENCES users(id),
    external_reference VARCHAR(255),

    -- Status
    status VARCHAR(20) DEFAULT 'pending',

    -- Metadata
    description TEXT NOT NULL,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Reconciliations
CREATE TABLE reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    reconciliation_date DATE NOT NULL,

    payment_account_id UUID NOT NULL REFERENCES payment_accounts(id),

    -- Internal records
    internal_balance DECIMAL(15, 2) NOT NULL,
    internal_transaction_count INTEGER NOT NULL,

    -- External records
    external_balance DECIMAL(15, 2) NOT NULL,
    external_transaction_count INTEGER NOT NULL,

    -- Matching results
    matched_transactions INTEGER DEFAULT 0,
    unmatched_internal INTEGER DEFAULT 0,
    unmatched_external INTEGER DEFAULT 0,
    discrepancy_amount DECIMAL(15, 2) DEFAULT 0.00,

    -- Status
    status VARCHAR(20) DEFAULT 'pending',

    reconciled_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- External Transactions (from bank statements)
CREATE TABLE external_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID NOT NULL REFERENCES reconciliations(id),

    -- Transaction details
    reference VARCHAR(255) NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(10) NOT NULL,           -- 'credit' or 'debit'
    description TEXT,
    balance_after DECIMAL(15, 2),

    -- Matching
    is_matched BOOLEAN DEFAULT FALSE,
    matched_wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    matched_by UUID REFERENCES users(id),
    matched_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation Exceptions
CREATE TABLE reconciliation_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID NOT NULL REFERENCES reconciliations(id),

    exception_type VARCHAR(50) NOT NULL,

    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    external_transaction_id UUID REFERENCES external_transactions(id),

    discrepancy_amount DECIMAL(15, 2) NOT NULL,

    resolution_status VARCHAR(20) DEFAULT 'pending',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Security & Compliance

### Access Control

```typescript
// Wallet permissions
enum WalletPermission {
  VIEW_BALANCE = 'wallet:view_balance',
  VIEW_TRANSACTIONS = 'wallet:view_transactions',
  CREATE_TRANSACTION = 'wallet:create_transaction',
  APPROVE_TRANSACTION = 'wallet:approve_transaction',
  RECONCILE = 'wallet:reconcile',
  APPROVE_RECONCILIATION = 'wallet:approve_reconciliation',
}

// Role-based access
const rolePermissions = {
  BusinessAdministrator: [
    ...Object.values(WalletPermission)
  ],
  InstitutionAdministrator: [
    ...Object.values(WalletPermission)
  ],
  BusinessStaff: [
    WalletPermission.VIEW_BALANCE,
    WalletPermission.VIEW_TRANSACTIONS,
    WalletPermission.RECONCILE,
  ],
  InstitutionStaff: [
    WalletPermission.VIEW_BALANCE,
    WalletPermission.VIEW_TRANSACTIONS,
  ],
};
```

### Audit Trail

Every wallet transaction and reconciliation must be fully auditable:
- Who created it
- When it was created
- Who approved it (if applicable)
- Who reconciled it
- Changes to status
- Attachments and supporting documents

### Compliance Requirements

**For Educational Institutions:**
- Government audit compliance
- Board of Governors reporting
- NHIF/NSSF remittance tracking

**For Religious Organizations:**
- Transparent financial reporting
- Tax-deductible contribution tracking
- Donor privacy protection

**For Real Estate:**
- Security deposit liability tracking
- Landlord reporting (if applicable)
- Tax compliance for rental income

**For All Organizations:**
- Anti-money laundering (AML) checks
- Know Your Customer (KYC) compliance
- Financial reporting standards

---

## 6. UI/UX Guidelines

### Wallet Dashboard

**Key Metrics:**
- Current balance (by currency)
- Pending incoming/outgoing
- Today's transactions
- This month's income/expenses

**Visual Design:**
- Use organization-specific branding
- Display relevant transaction types (e.g., "Tithe" for churches, "School Fees" for schools)
- Color-coded transaction types (green for income, red for expenses)

### Reconciliation Interface

**Import Statement:**
- Drag-and-drop CSV/Excel upload
- Template download for different banks/M-Pesa
- Automatic column mapping

**Matching View:**
- Side-by-side comparison (internal vs external)
- Green highlight for matched transactions
- Red highlight for discrepancies
- Manual match button for unmatched items

**Exception Resolution:**
- Clear explanation of exception type
- Input fields for resolution notes
- Approval workflow

---

## 7. Testing Strategy

### Unit Tests
- Wallet balance calculations
- Transaction creation
- Automatic matching algorithm
- CSV parsing

### Integration Tests
- End-to-end reconciliation workflow
- Multi-account reconciliation
- Approval workflows

### Organization-Specific Tests
- School fee reconciliation scenarios
- Church giving reconciliation
- Rent collection reconciliation

---

## 8. References & Resources

**Financial Best Practices:**
- [GAAP (Generally Accepted Accounting Principles)](https://www.fasb.org/)
- [IFRS (International Financial Reporting Standards)](https://www.ifrs.org/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

**Industry-Specific:**
- [School Financial Management Guidelines](https://www.education.go.ke/)
- [Church Financial Accountability](https://www.ecfa.org/)
- [Real Estate Accounting Standards](https://www.iasplus.com/en/standards/ias/ias40)

---

## 9. Glossary

- **Wallet**: Virtual ledger tracking organization's liquid cash across payment methods
- **Reconciliation**: Matching internal records with external bank/M-Pesa statements
- **External Transaction**: Transaction recorded in bank/M-Pesa statement
- **Internal Transaction**: Transaction recorded in organization's wallet system
- **Discrepancy**: Difference between internal and external records
- **Matched Transaction**: Internal transaction successfully linked to external transaction
- **Unmatched Transaction**: Transaction in one system but not the other
- **Exception**: Discrepancy requiring manual review and resolution

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Author:** Claude Code
**Status:** Recommendation for Implementation
