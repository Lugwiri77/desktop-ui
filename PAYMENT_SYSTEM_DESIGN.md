# Real Estate Payment System - Complete Design & Implementation Guide

**Date:** December 8, 2025  
**Status:** 📋 Design Phase - Awaiting Approval  
**Platforms:** Desktop UI, Android, iOS  

---

## 🎯 Executive Summary

This document outlines a **comprehensive payment system** for the real estate management platform, covering:
- Rent payments & arrears tracking
- M-Pesa & Visa/card integration
- Multi-tenant payment allocation
- Offline-first architecture
- Service fees & revenue model
- Security & compliance

---

## 📊 Part 1: Architecture Decisions

### 1.1 UI Placement Recommendation

**✅ RECOMMENDED: Dedicated Submenu Item**

**Rationale:**
```
Dashboard                     Payment Management (Submenu)
├─ Quick Stats               ├─ Rent Collection
├─ Recent Activity           ├─ Payment History
├─ Alerts                    ├─ Arrears Management
└─ Overview Charts           ├─ Payment Methods
                             ├─ Transaction Reconciliation
                             └─ Reports & Analytics
```

**Why NOT in Dashboard:**
- ❌ Dashboard would become cluttered with payment details
- ❌ Payments require multiple views (collection, history, reconciliation)
- ❌ Different user roles need different payment access levels
- ❌ Payment workflows are complex (not quick-view material)

**Why YES to Submenu:**
- ✅ Clear separation of concerns
- ✅ Dedicated space for payment workflows
- ✅ Better RBAC implementation
- ✅ Room for payment reports & analytics
- ✅ Scales well as payment features grow

---

## 🏗️ Part 2: System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Desktop  │  │ Android  │  │   iOS    │                  │
│  │   UI     │  │   App    │  │   App    │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       └─────────────┼─────────────┘                         │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Server                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           GraphQL API (with Auth)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Payment    │  │  Webhook     │  │  Reconciliation │  │
│  │   Service    │  │  Handlers    │  │     Service     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         └──────────────────┼─────────────────────┘          │
└────────────────────────────┼──────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌─────────────────┐                    ┌──────────────────┐
│  M-Pesa Daraja  │                    │  Payment Gateway │
│      API        │                    │  (Stripe/Flutterwave)│
│  - STK Push     │                    │  - Cards (Visa)  │
│  - C2B          │                    │  - Mobile Money  │
│  - B2C          │                    │  - Bank Transfer │
└─────────────────┘                    └──────────────────┘
```

---

## 💰 Part 3: Payment Models & Revenue

### 3.1 Payment Architecture Models

**✅ RECOMMENDED: Hybrid Model (Best Practice)**

#### Model Comparison:

| Model | Description | Pros | Cons | Best For |
|-------|-------------|------|------|----------|
| **Direct Payment** | Tenant → Landlord paybill | No platform fees | No platform revenue, less control | Small properties |
| **Aggregated Payment** | Tenant → Platform → Landlord | Platform takes fee, better UX | Higher complexity | Medium-large properties |
| **Hybrid (Recommended)** | Both options available | Flexibility, multiple revenue streams | Most complex to implement | All property sizes |

#### Hybrid Model Details:

**Option A: Direct Payment (Lower Fee)**
```
Tenant → Landlord's Paybill/Account
Platform Fee: 0.5% - 1% (convenience fee)
Use Case: Regular monthly rent
```

**Option B: Platform Wallet (Higher Fee)**
```
Tenant → Platform Wallet → Landlord
Platform Fee: 2% - 3%
Benefits: Instant allocation, split payments, escrow
Use Case: Multiple properties, deposits, partial payments
```

### 3.2 Fee Structure Recommendations

#### M-Pesa Fees (Kenya):
```
Transaction Amount          M-Pesa Fee    Your Service Fee
KES 1 - 49                 KES 0         KES 0
KES 50 - 100               KES 0         KES 2
KES 101 - 500              KES 7         KES 5
KES 501 - 1,000            KES 13        KES 10
KES 1,001 - 1,500          KES 23        KES 15
KES 1,501 - 2,500          KES 33        KES 20
KES 2,501 - 3,500          KES 54        KES 30
KES 3,501 - 5,000          KES 57        KES 35
KES 5,001 - 7,500          KES 78        KES 50
KES 7,501 - 10,000         KES 90        KES 60
KES 10,001 - 15,000        KES 100       KES 80
KES 15,001 - 20,000        KES 105       KES 100
KES 20,001 - 35,000        KES 108       KES 150
KES 35,001 - 50,000        KES 110       KES 200
KES 50,001 - 150,000       KES 110       1% of amount
```

#### Card Payments (Visa/Mastercard):
```
International Cards: 3.5% + KES 20 (Gateway fee)
Your Service Fee:    1.5% - 2%
Total to Customer:   5% + KES 20
```

**Recommendation:** Absorb gateway fees for amounts > KES 50,000 to encourage large payments.

---

## 🗄️ Part 4: Database Schema

### 4.1 Core Payment Tables

```sql
-- Payment Accounts (Paybills/Bank Accounts)
CREATE TABLE payment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_type VARCHAR(20) NOT NULL, -- 'mpesa_paybill', 'mpesa_till', 'bank_account', 'platform_wallet'
    owner_type VARCHAR(20) NOT NULL, -- 'property', 'unit', 'platform', 'tenant'
    owner_id UUID NOT NULL,
    
    -- M-Pesa Details
    paybill_number VARCHAR(20),
    account_number VARCHAR(50),
    till_number VARCHAR(20),
    
    -- Bank Details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(100),
    swift_code VARCHAR(20),
    
    -- Card Details (tokenized)
    card_token VARCHAR(255),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20), -- 'visa', 'mastercard'
    card_expiry_month INT,
    card_expiry_year INT,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent Payment Schedules
CREATE TABLE rent_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    amount DECIMAL(12, 2) NOT NULL,
    payment_frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
    custom_frequency_days INT, -- For custom frequency
    
    due_day_of_month INT, -- 1-31 for monthly
    due_day_of_week INT, -- 0-6 for weekly (0 = Sunday)
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    auto_generate_invoices BOOLEAN DEFAULT true,
    send_reminders BOOLEAN DEFAULT true,
    reminder_days_before INT DEFAULT 3,
    
    late_fee_amount DECIMAL(12, 2),
    late_fee_percentage DECIMAL(5, 2),
    grace_period_days INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent Invoices (Auto-generated from schedules)
CREATE TABLE rent_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES rent_schedules(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Amounts
    rent_amount DECIMAL(12, 2) NOT NULL,
    late_fee_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL,
    
    -- Dates
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue', 'cancelled'
    
    -- Period covered
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    external_ref VARCHAR(100), -- M-Pesa/Gateway reference
    
    -- Parties
    payer_id UUID, -- Tenant ID
    payer_type VARCHAR(20), -- 'tenant', 'guest'
    payer_phone VARCHAR(20),
    payer_name VARCHAR(200),
    
    payee_id UUID, -- Landlord/Property ID
    payee_type VARCHAR(20), -- 'property', 'unit', 'platform'
    
    -- Payment Details
    payment_method VARCHAR(20) NOT NULL, -- 'mpesa', 'card', 'bank_transfer', 'wallet'
    payment_account_id UUID REFERENCES payment_accounts(id),
    
    -- Amounts
    gross_amount DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) DEFAULT 0,
    gateway_fee DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,
    
    currency VARCHAR(3) DEFAULT 'KES',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'reversed', 'refunded'
    
    -- Related Invoice
    invoice_id UUID REFERENCES rent_invoices(id),
    
    -- Metadata
    description TEXT,
    metadata JSONB, -- Store additional data (split allocations, etc.)
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    failure_reason TEXT,
    
    -- Reconciliation
    reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Allocations (For split payments)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    invoice_id UUID NOT NULL REFERENCES rent_invoices(id),
    
    allocated_amount DECIMAL(12, 2) NOT NULL,
    allocation_type VARCHAR(20), -- 'rent', 'late_fee', 'deposit', 'utility'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Wallet (User balance for app services)
CREATE TABLE wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    user_type VARCHAR(20) NOT NULL, -- 'tenant', 'landlord', 'admin'
    
    available_balance DECIMAL(12, 2) DEFAULT 0,
    pending_balance DECIMAL(12, 2) DEFAULT 0, -- Funds on hold
    total_balance DECIMAL(12, 2) DEFAULT 0,
    
    currency VARCHAR(3) DEFAULT 'KES',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallet_balances(id),
    
    transaction_type VARCHAR(20) NOT NULL, -- 'credit', 'debit', 'hold', 'release'
    amount DECIMAL(12, 2) NOT NULL,
    
    source VARCHAR(50), -- 'topup', 'rent_payment', 'refund', 'commission'
    reference_type VARCHAR(20), -- 'payment', 'invoice', 'topup'
    reference_id UUID,
    
    description TEXT,
    
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Webhooks (For tracking callback status)
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES payment_transactions(id),
    
    provider VARCHAR(20), -- 'mpesa', 'stripe', 'flutterwave'
    webhook_type VARCHAR(50), -- 'callback', 'ipn', 'webhook'
    
    payload JSONB NOT NULL,
    headers JSONB,
    
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    
    error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_accounts_owner ON payment_accounts(owner_type, owner_id);
CREATE INDEX idx_rent_schedules_unit ON rent_schedules(unit_id);
CREATE INDEX idx_rent_schedules_tenant ON rent_schedules(tenant_id);
CREATE INDEX idx_rent_invoices_tenant ON rent_invoices(tenant_id);
CREATE INDEX idx_rent_invoices_status ON rent_invoices(status);
CREATE INDEX idx_rent_invoices_due_date ON rent_invoices(due_date);
CREATE INDEX idx_payment_transactions_ref ON payment_transactions(transaction_ref);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_payer ON payment_transactions(payer_id);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
```

---

## 🔐 Part 5: RBAC Implementation

### 5.1 Payment Permissions

```typescript
// Permission Matrix
const PAYMENT_PERMISSIONS = {
  // Landlord/Property Manager
  LANDLORD: {
    canViewPayments: true,
    canViewAllPropertyPayments: true,
    canConfigurePaymentAccounts: true,
    canSetRentSchedules: true,
    canGenerateInvoices: true,
    canProcessRefunds: true,
    canViewReports: true,
    canReconcilePayments: true,
    canWithdrawFunds: true,
  },
  
  // Tenant
  TENANT: {
    canViewOwnPayments: true,
    canMakePayments: true,
    canViewOwnInvoices: true,
    canAddPaymentMethods: true,
    canTopupWallet: true,
    canViewPaymentHistory: true,
    canDownloadReceipts: true,
  },
  
  // Property Manager (Staff)
  PROPERTY_MANAGER: {
    canViewPayments: true,
    canViewAssignedPropertyPayments: true,
    canGenerateInvoices: true,
    canSendReminders: true,
    canRecordManualPayments: true,
    canViewReports: true,
  },
  
  // Accountant (Staff)
  ACCOUNTANT: {
    canViewAllPayments: true,
    canReconcilePayments: true,
    canGenerateFinancialReports: true,
    canExportData: true,
    canViewWalletBalances: true,
  },
  
  // Platform Admin
  ADMIN: {
    allPermissions: true,
  },
};
```

### 5.2 GraphQL Permissions

```rust
// Backend permission checks
async fn verify_payment_access(
    db: &PgPool,
    user_id: &Uuid,
    user_role: &UserRole,
    resource_id: &Uuid,
    resource_type: PaymentResourceType,
) -> Result<bool> {
    match user_role {
        UserRole::Tenant => {
            // Tenants can only access their own payments
            verify_tenant_owns_resource(db, user_id, resource_id, resource_type).await
        }
        UserRole::Landlord | UserRole::PropertyManager => {
            // Verify property ownership
            verify_property_access(db, user_id, resource_id, resource_type).await
        }
        UserRole::Admin => Ok(true),
        _ => Ok(false),
    }
}
```

---

## 📱 Part 6: Payment Flows

### 6.1 M-Pesa STK Push Flow (Recommended for Rent)

```
Tenant Mobile App/Desktop
         │
         │ 1. Select Invoice → Pay Now
         ▼
   GraphQL Mutation
   initiatePayment(invoiceId, phoneNumber)
         │
         │ 2. Create transaction record (status: pending)
         ▼
   Backend Payment Service
         │
         │ 3. Call M-Pesa STK Push API
         ▼
   M-Pesa Daraja API
         │
         │ 4. Send STK Push to phone
         ▼
   Tenant's Phone (M-Pesa Popup)
         │
         │ 5. Enter PIN → Confirm
         ▼
   M-Pesa processes payment
         │
         │ 6. Callback to webhook
         ▼
   Backend Webhook Handler
         │
         │ 7. Update transaction (status: completed)
         │ 8. Allocate payment to invoice
         │ 9. Update invoice status
         │ 10. Trigger notifications
         ▼
   Frontend (Real-time update via WebSocket/Polling)
         │
         ▼
   Show success message + receipt
```

### 6.2 Card Payment Flow (Stripe/Flutterwave)

```
Tenant enters card details
         │
         │ 1. Tokenize card (frontend SDK)
         ▼
   Payment Gateway (Stripe/Flutter)
         │
         │ 2. Return card token
         ▼
   Frontend sends token to backend
         │
         │ 3. GraphQL: processCardPayment(invoiceId, cardToken)
         ▼
   Backend Payment Service
         │
         │ 4. Charge card via gateway
         ▼
   Payment Gateway processes
         │
         │ 5. Return result (success/failure/3DS required)
         ▼
   If 3DS required:
         │
         │ 6. Redirect to 3DS page
         ▼
   User completes 3DS
         │
         │ 7. Callback with result
         ▼
   Backend updates transaction
         │
         ▼
   Frontend shows result
```

### 6.3 Platform Wallet Flow

```
Tenant tops up wallet
         │
         │ 1. Via M-Pesa/Card
         ▼
   Funds added to wallet_balances
         │
         │ 2. Tenant pays invoice from wallet
         ▼
   GraphQL: payFromWallet(invoiceId)
         │
         │ 3. Check wallet balance
         │ 4. Deduct amount
         │ 5. Create payment transaction
         │ 6. Allocate to invoice
         ▼
   Instant payment (no external gateway delay)
```

---

## 🔄 Part 7: Offline-First Implementation

### 7.1 Payment Mutations (Offline Capable)

```typescript
// Desktop UI - Offline Payment Recording
const recordPaymentMutation = useOfflineMutation(
  recordManualPayment,
  {
    module: 'payments',
    operation: 'recordManualPayment',
    priority: 'high', // Financial data is critical
    invalidateKeys: ['invoices', 'payments', 'arrears'],
    successMessage: 'Payment recorded successfully',
    optimisticUpdate: {
      queryKey: ['invoices'],
      updater: (oldData, variables) =>
        oldData.map((invoice) =>
          invoice.id === variables.invoiceId
            ? {
                ...invoice,
                paid_amount: invoice.paid_amount + variables.amount,
                balance: invoice.balance - variables.amount,
                status: invoice.balance - variables.amount === 0 ? 'paid' : 'partial',
              }
            : invoice
        ),
    },
  }
);

// Mobile - Initiate Payment (Cannot be offline - requires network)
const initiatePaymentMutation = useMutation({
  mutationFn: initiateM
PesaPayment,
  onMutate: () => {
    // Check network first
    if (!navigator.onLine) {
      throw new Error('Payment requires internet connection');
    }
  },
  onSuccess: (data) => {
    // Poll for status updates
    startPaymentStatusPolling(data.transactionRef);
  },
});
```

### 7.2 What Can Work Offline vs Online Only

**✅ Can Work Offline:**
- Viewing payment history
- Viewing invoices
- Recording manual payments (cash/bank transfer) - will sync later
- Generating reports from cached data
- Viewing arrears

**❌ Requires Online:**
- Initiating M-Pesa/Card payments
- Real-time balance checks
- Webhook processing
- Bank/gateway communication
- Live payment status updates

---

## 🔔 Part 8: Real-Time Updates

### 8.1 WebSocket/SSE Implementation

```typescript
// Frontend - Listen for payment updates
const { data: paymentStatus } = useSubscription({
  queryKey: ['paymentStatus', transactionRef],
  subscription: () => {
    const ws = new WebSocket(`ws://api.example.com/payments/${transactionRef}`);
    
    ws.onmessage = (event) => {
      const status = JSON.parse(event.data);
      return status;
    };
    
    return () => ws.close();
  },
});

// Backend - Webhook handler pushes updates
async fn handle_mpesa_callback(payload: MpesaCallback) -> Result<()> {
    // Update transaction
    let transaction = update_transaction_status(&payload).await?;
    
    // Push update via WebSocket
    broadcast_payment_update(PaymentUpdate {
        transaction_ref: transaction.transaction_ref,
        status: transaction.status,
        amount: transaction.gross_amount,
        timestamp: Utc::now(),
    }).await?;
    
    Ok(())
}
```

### 8.2 Polling Fallback (For older browsers)

```typescript
// Poll every 3 seconds for 2 minutes max
const pollPaymentStatus = async (transactionRef: string) => {
  const maxAttempts = 40; // 2 minutes
  let attempts = 0;
  
  const poll = setInterval(async () => {
    attempts++;
    
    const status = await getPaymentStatus(transactionRef);
    
    if (status.isComplete || attempts >= maxAttempts) {
      clearInterval(poll);
      handlePaymentComplete(status);
    }
  }, 3000);
};
```

---

## 💳 Part 9: Payment Gateway Integration

### 9.1 M-Pesa Daraja API

#### Configuration:
```rust
// Backend environment variables
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://api.example.com/webhooks/mpesa
```

#### STK Push Implementation:
```rust
pub async fn initiate_mpesa_payment(
    amount: f64,
    phone_number: &str,
    account_reference: &str,
    transaction_desc: &str,
) -> Result<MpesaResponse> {
    // 1. Get access token
    let token = get_mpesa_access_token().await?;
    
    // 2. Generate timestamp
    let timestamp = Utc::now().format("%Y%m%d%H%M%S").to_string();
    
    // 3. Generate password
    let password = base64::encode(format!(
        "{}{}{}",
        env::var("MPESA_SHORTCODE")?,
        env::var("MPESA_PASSKEY")?,
        timestamp
    ));
    
    // 4. Make STK push request
    let client = reqwest::Client::new();
    let response = client
        .post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "BusinessShortCode": env::var("MPESA_SHORTCODE")?,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": env::var("MPESA_SHORTCODE")?,
            "PhoneNumber": phone_number,
            "CallBackURL": env::var("MPESA_CALLBACK_URL")?,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }))
        .send()
        .await?
        .json::<MpesaResponse>()
        .await?;
    
    Ok(response)
}
```

#### Adding Service Fee:
```rust
// Calculate total with service fee
pub fn calculate_payment_with_fees(
    rent_amount: f64,
    payment_method: PaymentMethod,
) -> PaymentBreakdown {
    let platform_fee = match payment_method {
        PaymentMethod::MpesaDirect => rent_amount * 0.005, // 0.5%
        PaymentMethod::MpesaWallet => rent_amount * 0.025, // 2.5%
        PaymentMethod::Card => rent_amount * 0.02, // 2%
    };
    
    let gateway_fee = match payment_method {
        PaymentMethod::MpesaDirect | PaymentMethod::MpesaWallet => {
            calculate_mpesa_fee(rent_amount)
        }
        PaymentMethod::Card => rent_amount * 0.035 + 20.0, // 3.5% + KES 20
    };
    
    PaymentBreakdown {
        rent_amount,
        platform_fee,
        gateway_fee,
        total: rent_amount + platform_fee + gateway_fee,
    }
}
```

### 9.2 Card Payment Integration (Stripe/Flutterwave)

**Recommendation: Flutterwave (Better for Kenya)**

#### Why Flutterwave:
- ✅ Lower fees for African cards
- ✅ Supports M-Pesa too (single integration)
- ✅ Better KES support
- ✅ Local support

#### Implementation:
```rust
pub async fn process_card_payment(
    amount: f64,
    card_token: &str,
    email: &str,
    tx_ref: &str,
) -> Result<FlutterwaveResponse> {
    let client = reqwest::Client::new();
    
    let response = client
        .post("https://api.flutterwave.com/v3/charges?type=card")
        .header("Authorization", format!("Bearer {}", env::var("FLW_SECRET_KEY")?))
        .json(&json!({
            "token": card_token,
            "currency": "KES",
            "amount": amount,
            "email": email,
            "tx_ref": tx_ref,
            "redirect_url": env::var("FLW_REDIRECT_URL")?,
        }))
        .send()
        .await?
        .json::<FlutterwaveResponse>()
        .await?;
    
    Ok(response)
}
```

---

## 📊 Part 10: Implementation Phases

### Phase 1: Foundation (Week 1-2) - PRIORITY
**Goal:** Basic payment recording & viewing

- [ ] Database schema creation
- [ ] Payment accounts CRUD
- [ ] Manual payment recording
- [ ] Invoice generation (manual)
- [ ] Payment history viewing
- [ ] Basic arrears calculation
- [ ] RBAC implementation

**Deliverables:**
- Landlords can record cash/bank payments
- Tenants can view their invoices
- Basic payment reports

### Phase 2: Automation (Week 3-4)
**Goal:** Automated invoicing & schedules

- [ ] Rent schedule configuration
- [ ] Automatic invoice generation (cron job)
- [ ] Email/SMS reminders
- [ ] Late fee calculation
- [ ] Payment allocation logic
- [ ] Arrears dashboard

**Deliverables:**
- Auto-generated monthly invoices
- Automated reminders
- Comprehensive arrears tracking

### Phase 3: M-Pesa Integration (Week 5-6)
**Goal:** Live M-Pesa payments

- [ ] M-Pesa Daraja API integration
- [ ] STK Push implementation
- [ ] Webhook handler
- [ ] Real-time status updates
- [ ] M-Pesa reconciliation
- [ ] Service fee calculation

**Deliverables:**
- Tenants can pay via M-Pesa
- Real-time payment confirmation
- Automatic reconciliation

### Phase 4: Card Payments (Week 7-8)
**Goal:** International payment support

- [ ] Flutterwave integration
- [ ] Card tokenization
- [ ] 3DS support
- [ ] Card management UI
- [ ] Refund handling

**Deliverables:**
- Card payment option
- Saved cards feature
- Refund capability

### Phase 5: Platform Wallet (Week 9-10)
**Goal:** App wallet for multiple services

- [ ] Wallet balance management
- [ ] Top-up functionality
- [ ] Wallet-to-wallet transfers
- [ ] Pay-from-wallet option
- [ ] Wallet transaction history

**Deliverables:**
- Users can maintain wallet balance
- Instant payments from wallet
- Multi-service wallet (future expansion)

### Phase 6: Mobile Apps (Week 11-14)
**Goal:** Native iOS/Android apps

- [ ] React Native/Flutter app
- [ ] Mobile-optimized payment UI
- [ ] Push notifications
- [ ] Offline payment history
- [ ] Mobile card entry
- [ ] M-Pesa USSD fallback

**Deliverables:**
- iOS app (TestFlight)
- Android app (Play Store)
- Feature parity with desktop

### Phase 7: Advanced Features (Week 15+)
**Goal:** Enterprise features

- [ ] Split payments (multiple tenants)
- [ ] Partial payments
- [ ] Payment plans
- [ ] Escrow for deposits
- [ ] Multi-currency support
- [ ] Bulk payment import
- [ ] Advanced reconciliation
- [ ] Financial reports & analytics

---

## 🔒 Part 11: Security & Compliance

### 11.1 Security Measures

```typescript
// 1. Payment Data Encryption
const encryptPaymentData = (data: PaymentData) => {
  // Use AES-256 for sensitive data
  return encrypt(data, process.env.ENCRYPTION_KEY);
};

// 2. Card Tokenization (Never store raw card data)
const tokenizeCard = async (cardDetails: CardDetails) => {
  // Use gateway SDK to tokenize
  const token = await flutterwaveSDK.tokenize(cardDetails);
  return token; // Only store token, not card details
};

// 3. Webhook Signature Verification
const verifyWebhookSignature = (payload: string, signature: string) => {
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
};

// 4. Rate Limiting
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 payment attempts per 15 minutes
});
```

### 11.2 Compliance

**PCI-DSS Compliance:**
- ❌ Never store card CVV
- ❌ Never store full PAN (card number)
- ✅ Store only tokenized card references
- ✅ Use gateway-provided card forms (hosted/embedded)
- ✅ HTTPS everywhere
- ✅ Regular security audits

**Kenya Data Protection Act:**
- ✅ User consent for data collection
- ✅ Right to data deletion
- ✅ Secure data storage
- ✅ Data breach notification procedures

**Financial Regulations:**
- ✅ Clear fee disclosure
- ✅ Transaction receipts
- ✅ Refund policy
- ✅ Audit trails

---

## 💰 Part 12: Cost Analysis

### 12.1 Monthly Operating Costs (Estimated)

```
Service                     Monthly Cost (KES)
───────────────────────────────────────────────
M-Pesa API (per month)      Included (pay-per-transaction)
Flutterwave Account         Free (pay-per-transaction)
Database (PostgreSQL)       ~5,000 (managed hosting)
Backend Server (API)        ~10,000 (DigitalOcean/AWS)
WebSocket Server            ~3,000 (real-time updates)
SMS API (Africa's Talking)  ~0.80 per SMS
Email Service (SendGrid)    ~2,000 (first 40k emails free)
SSL Certificates            Free (Let's Encrypt)
Monitoring (Sentry)         ~3,000

TOTAL BASE COST:            ~23,000 KES/month
───────────────────────────────────────────────

Transaction Costs:
M-Pesa: As per table above (borne by user or absorbed)
Cards: 3.5% + KES 20 (gateway fee)
Platform Fee: 0.5% - 3% (your revenue)

Break-even: ~100 transactions/month
Profitable: 500+ transactions/month
```

### 12.2 Revenue Projections

**Conservative Scenario (100 units):**
```
Average rent: KES 30,000
Monthly transactions: 100 payments
Platform fee: 1% average

Revenue: 100 × 30,000 × 0.01 = KES 30,000/month
Operating costs: KES 23,000/month
NET PROFIT: KES 7,000/month
```

**Growth Scenario (500 units):**
```
Average rent: KES 30,000
Monthly transactions: 500 payments
Platform fee: 1.5% average (wallet adoption)

Revenue: 500 × 30,000 × 0.015 = KES 225,000/month
Operating costs: KES 35,000/month (scaled)
NET PROFIT: KES 190,000/month
```

---

## 🎯 Part 13: Recommendations Summary

### UI/UX Recommendations:
1. ✅ **Dedicated Payment Submenu** (NOT in dashboard)
2. ✅ **Mobile-first design** for payment pages
3. ✅ **Real-time status indicators** (loading, success, failure)
4. ✅ **Clear fee disclosure** before payment
5. ✅ **One-click repeat payments** (saved methods)

### Architecture Recommendations:
1. ✅ **Hybrid payment model** (Direct + Wallet)
2. ✅ **M-Pesa as primary** (95% of Kenya uses M-Pesa)
3. ✅ **Flutterwave for cards** (better African support than Stripe)
4. ✅ **Platform wallet** for multi-service future
5. ✅ **Webhook-driven status updates** (not polling)

### Implementation Recommendations:
1. ✅ **Phase 1-3 first** (Foundation + M-Pesa) - 6 weeks
2. ✅ **Offline support for viewing only** (payments require online)
3. ✅ **Real-time updates via WebSocket** (SSE fallback)
4. ✅ **Comprehensive RBAC** from day one
5. ✅ **Audit trail for all financial operations**

### Cost Optimization:
1. ✅ **Absorb gateway fees for large payments** (> KES 50k)
2. ✅ **Encourage wallet top-ups** (lower per-transaction cost)
3. ✅ **Tiered pricing** (lower % for high-volume landlords)
4. ✅ **Use managed services** (don't build payment infrastructure)

### Security Recommendations:
1. ✅ **Never store card details** (tokenization only)
2. ✅ **HTTPS everywhere** (enforce TLS 1.3+)
3. ✅ **Rate limiting on payment endpoints**
4. ✅ **Webhook signature verification**
5. ✅ **Regular security audits** (quarterly)

---

## 📋 Next Steps - Decision Points

### Questions to Answer Before Implementation:

1. **Payment Model:**
   - [ ] Hybrid (Direct + Wallet) - RECOMMENDED
   - [ ] Direct only (simpler, lower revenue)
   - [ ] Wallet only (higher control, higher fees)

2. **Fee Structure:**
   - [ ] Tiered based on volume
   - [ ] Flat percentage (1-2%)
   - [ ] Free for first 3 months (acquisition strategy)

3. **Priority Features:**
   - [ ] M-Pesa first (Phase 3) - RECOMMENDED
   - [ ] Cards first (international tenants)
   - [ ] Both simultaneously (longer dev time)

4. **Mobile Strategy:**
   - [ ] Web-based mobile (faster, one codebase)
   - [ ] Native apps (better UX, longer dev time) - RECOMMENDED
   - [ ] Hybrid (React Native/Flutter)

5. **Reconciliation:**
   - [ ] Manual reconciliation (simpler)
   - [ ] Semi-automated (recommended for start)
   - [ ] Fully automated (complex, better at scale)

---

## 📄 Appendix: API Endpoints

### GraphQL Mutations

```graphql
# Payment Accounts
mutation CreatePaymentAccount($input: CreatePaymentAccountInput!) {
  createPaymentAccount(input: $input) {
    id
    accountType
    isDefault
  }
}

# Rent Schedules
mutation CreateRentSchedule($input: CreateRentScheduleInput!) {
  createRentSchedule(input: $input) {
    id
    amount
    paymentFrequency
  }
}

# Invoices
mutation GenerateInvoice($scheduleId: String!) {
  generateInvoice(scheduleId: $scheduleId) {
    id
    invoiceNumber
    totalAmount
    dueDate
  }
}

# Payments
mutation InitiateM PesaPayment($input: InitiateMpesaPaymentInput!) {
  initiateMpesaPayment(input: $input) {
    transactionRef
    status
    checkoutRequestId
  }
}

mutation ProcessCardPayment($input: ProcessCardPaymentInput!) {
  processCardPayment(input: $input) {
    transactionRef
    status
    authUrl # For 3DS
  }
}

mutation RecordManualPayment($input: RecordManualPaymentInput!) {
  recordManualPayment(input: $input) {
    transactionRef
    status
  }
}

# Wallet
mutation TopupWallet($amount: Float!, $method: PaymentMethod!) {
  topupWallet(amount: $amount, method: $method) {
    transactionRef
    newBalance
  }
}

mutation PayFromWallet($invoiceId: String!) {
  payFromWallet(invoiceId: $invoiceId) {
    success
    transactionRef
    remainingBalance
  }
}
```

### GraphQL Queries

```graphql
# Invoices
query GetTenantInvoices($tenantId: String!, $status: InvoiceStatus) {
  getTenantInvoices(tenantId: $tenantId, status: $status) {
    id
    invoiceNumber
    totalAmount
    paidAmount
    balance
    dueDate
    status
  }
}

# Payments
query GetPaymentHistory($filters: PaymentFilters!) {
  getPaymentHistory(filters: $filters) {
    transactions {
      id
      transactionRef
      amount
      status
      paymentMethod
      createdAt
    }
    pagination {
      total
      page
      pageSize
    }
  }
}

# Arrears
query GetArrearsReport($propertyId: String!) {
  getArrearsReport(propertyId: $propertyId) {
    totalArrears
    tenants {
      tenantId
      tenantName
      unitNumber
      amountDue
      daysPastDue
    }
  }
}

# Wallet
query GetWalletBalance {
  getWalletBalance {
    availableBalance
    pendingBalance
    totalBalance
  }
}
```

---

**Document Status:** Ready for Review & Decision  
**Next Action:** Review and approve architecture, then begin Phase 1 implementation

**Questions?** Let's discuss any section before implementation begins.
