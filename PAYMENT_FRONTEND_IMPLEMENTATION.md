# Payment System Frontend Implementation Plan

## ✅ Backend Status
All backend work is complete and ready:
- ✅ Database migrations
- ✅ GraphQL types, mutations, queries
- ✅ RBAC permissions (22 payment permissions)
- ✅ Wallet system with QR code support
- ✅ M-Pesa + Flutterwave integration
- ✅ Payment gateway abstraction (ready for IntaSend)

## 🎯 Frontend Implementation Tasks

### Phase 1: Navigation & Structure (Current)
- [ ] Add "Payments" submenu to sidebar
- [ ] Create payment routes structure
- [ ] Set up GraphQL queries/mutations
- [ ] Create payment types/interfaces

### Phase 2: Core Payment Pages
- [ ] Payment Dashboard (overview, stats, charts)
- [ ] Payment Accounts (list, create, edit)
- [ ] Invoice Management (list, detail, generate)
- [ ] Payment History (transactions, filters)
- [ ] Arrears Report

### Phase 3: Wallet Features
- [ ] Wallet Dashboard (balance, recent transactions)
- [ ] Top-up Wallet (M-Pesa, Flutterwave, IntaSend)
- [ ] QR Code Scanner (for payments)
- [ ] Wallet Transactions History
- [ ] Wallet-to-Wallet Transfer

### Phase 4: Payment Processing
- [ ] M-Pesa STK Push flow
- [ ] Card payment flow (Flutterwave)
- [ ] IntaSend payment flow (bank transfers, cards)
- [ ] Payment status tracking
- [ ] Receipt generation

### Phase 5: Advanced Features
- [ ] Arrears calculation & reports
- [ ] Payment reconciliation
- [ ] Bulk invoice generation
- [ ] Payment analytics & charts
- [ ] Export functionality

## 📁 File Structure

```
app/
├── payments/                    # NEW - Payment module
│   ├── layout.tsx              # Payment layout with submenu
│   ├── page.tsx                # Payment dashboard
│   ├── accounts/               # Payment accounts management
│   │   ├── page.tsx           # List accounts
│   │   ├── create/page.tsx    # Create account
│   │   └── [id]/page.tsx      # Edit account
│   ├── invoices/               # Invoice management
│   │   ├── page.tsx           # List invoices
│   │   ├── create/page.tsx    # Generate invoice
│   │   └── [id]/page.tsx      # Invoice detail
│   ├── transactions/           # Payment history
│   │   ├── page.tsx           # List transactions
│   │   └── [id]/page.tsx      # Transaction detail
│   ├── arrears/                # Arrears management
│   │   └── page.tsx           # Arrears report
│   ├── wallet/                 # Wallet features
│   │   ├── page.tsx           # Wallet dashboard
│   │   ├── topup/page.tsx     # Top-up wallet
│   │   ├── pay/page.tsx       # Pay with wallet (QR)
│   │   └── transactions/page.tsx  # Wallet transactions
│   └── reconciliation/         # Payment reconciliation
│       └── page.tsx
│
├── components/                 # Existing Catalyst components
│   ├── sidebar.tsx            # UPDATE - Add payments menu
│   └── payment/               # NEW - Payment-specific components
│       ├── payment-card.tsx
│       ├── invoice-card.tsx
│       ├── transaction-row.tsx
│       ├── qr-scanner.tsx
│       ├── payment-method-selector.tsx
│       └── amount-input.tsx
│
lib/
├── graphql/
│   └── payments/              # NEW - Payment GraphQL
│       ├── queries.ts
│       ├── mutations.ts
│       └── types.ts
│
└── utils/
    └── payment-utils.ts       # NEW - Payment helpers
```

## 🔧 Catalyst Components to Use

Based on your existing structure, we'll use:
- `Sidebar`, `SidebarItem`, `SidebarSection` - Navigation
- `Button`, `Link` - Actions
- `Dialog` - Modals for payment flows
- `Table` - Transaction lists
- `Badge` - Status indicators
- `Card` - Content containers

## 🎨 Payment Dashboard Design

```
┌─────────────────────────────────────────────────────────┐
│  💰 Payments                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│  │ Total     │  │ Pending   │  │ Overdue   │         │
│  │ Collected │  │ Payments  │  │ Amount    │         │
│  │ KES 2.5M  │  │ 12        │  │ KES 150K  │         │
│  └───────────┘  └───────────┘  └───────────┘         │
│                                                         │
│  Recent Transactions                      View All →   │
│  ┌────────────────────────────────────────────────┐   │
│  │ INV-001  │ Rent      │ KES 30,000  │ Completed │   │
│  │ INV-002  │ Deposit   │ KES 60,000  │ Pending   │   │
│  │ INV-003  │ Utilities │ KES 5,000   │ Failed    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Payment Methods                                        │
│  [M-Pesa] [Card] [Bank] [Wallet]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Implementation Order

### Week 1: Foundation
1. Update sidebar navigation
2. Create payment routes
3. Set up GraphQL integration
4. Build payment dashboard

### Week 2: Core Features
1. Payment accounts CRUD
2. Invoice management
3. Payment history view
4. Basic payment flow (M-Pesa)

### Week 3: Wallet & Advanced
1. Wallet dashboard
2. QR code scanner
3. Wallet top-up
4. Arrears management

### Week 4: Polish & Testing
1. Payment reconciliation
2. Analytics & reports
3. Testing & bug fixes
4. Documentation

## 🎯 Next Steps

1. **Review this plan** - Confirm approach
2. **Start with sidebar** - Add payment menu
3. **Build dashboard** - Create payment overview
4. **Implement flows** - Add payment processing
5. **Add IntaSend** - Backend integration for bank transfers/cards

Ready to start building? Let me know and I'll create the files!
