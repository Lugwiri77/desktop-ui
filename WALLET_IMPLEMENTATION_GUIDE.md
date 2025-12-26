# Desktop-UI Wallet Implementation Guide

**Priority:** HIGH - Organizations need wallet functionality
**Timeline:** 2-3 weeks
**Status:** Payment infrastructure 80% complete, need wallet UI

---

## Current Status

### ✅ Already Implemented
- GraphQL mutations for wallet operations (topUpWallet, transferWalletFunds, withdrawFromWallet)
- GraphQL queries for wallet balance and transactions
- Payment account management
- Invoice system
- Transaction tracking
- Backend webhook handlers for M-Pesa/Flutterwave/IntaSend

### ❌ Missing Components
- Wallet dashboard page
- Wallet top-up flow UI
- Payment gateway integration UI (STK push, card form)
- Real-time payment status updates
- Wallet transaction history display
- Receipt generation for wallet transactions

---

## Implementation Plan

### Phase 1: Wallet Dashboard (Week 1)

**File to Create:** `/app/wallet/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Badge } from '@/app/components/badge';
import { Card } from '@/app/components/card';
import { getWalletBalance, getWalletTransactions } from '@/lib/graphql/payments/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

interface WalletBalance {
  id: string;
  organizationUuid: string;
  balanceKes: number;
  balanceUsd: number;
  balanceEuro: number;
  isActive: boolean;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  walletBalanceId: string;
  transactionType: 'deposit' | 'withdrawal' | 'transfer';
  amountKes: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  description: string;
  transactionReference: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get organization ID from localStorage
  const getOrganizationId = () => {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo).organizationId;
      }
    }
    return null;
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      setError('Organization ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch balance
      const balanceData = await getWalletBalance(orgId);
      setBalance(balanceData);

      // Fetch recent transactions
      const transactionsData = await getWalletTransactions(orgId, { limit: 10 });
      setTransactions(transactionsData);

      setError(null);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading wallet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Heading>Wallet</Heading>
        <p className="mt-2 text-sm text-gray-600">
          Manage your organization's wallet balance and transactions
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">KES Balance</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(balance?.balanceKes || 0, 'KES')}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">USD Balance</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(balance?.balanceUsd || 0, 'USD')}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">EUR Balance</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(balance?.balanceEuro || 0, 'EUR')}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex gap-4">
        <Button onClick={() => router.push('/wallet/topup')}>
          Top Up Wallet
        </Button>
        <Button color="white" onClick={() => router.push('/wallet/transfer')}>
          Transfer Funds
        </Button>
        <Button color="white" onClick={() => router.push('/wallet/withdraw')}>
          Withdraw
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <Heading level={2}>Recent Transactions</Heading>
            <Button
              color="white"
              onClick={() => router.push('/wallet/transactions')}
            >
              View All
            </Button>
          </div>
        </div>

        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/wallet/transactions/${tx.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {tx.description}
                      </div>
                      <Badge color={getStatusBadgeColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {tx.paymentMethod} · {formatDate(tx.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Ref: {tx.transactionReference}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        tx.transactionType === 'deposit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.transactionType === 'deposit' ? '+' : '-'}
                      {formatCurrency(tx.amountKes, 'KES')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
```

**Update Navigation:** Add to `/app/components/sidebar.tsx` (around line 120):
```typescript
{userInfo && (
  <SidebarItem href="/wallet" current={pathname === '/wallet'}>
    <BanknotesIcon />
    <SidebarLabel>Wallet</SidebarLabel>
  </SidebarItem>
)}
```

---

### Phase 2: Wallet Top-Up Flow (Week 1)

**File to Create:** `/app/wallet/topup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Field, Label } from '@/app/components/fieldset';
import { topUpWallet } from '@/lib/graphql/payments/mutations';

enum PaymentMethod {
  MPESA = 'MPESA',
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export default function TopUpPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MPESA);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getOrganizationId = () => {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo).organizationId;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const orgId = getOrganizationId();
    if (!orgId) {
      setError('Organization ID not found');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentMethod === PaymentMethod.MPESA && !phoneNumber) {
      setError('Phone number is required for M-Pesa');
      return;
    }

    try {
      setLoading(true);

      const result = await topUpWallet({
        organizationId: orgId,
        amountKes: parseFloat(amount),
        paymentMethod,
        phoneNumber: paymentMethod === PaymentMethod.MPESA ? phoneNumber : undefined,
        reference: `TOPUP_${Date.now()}`,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/wallet');
        }, 2000);
      } else {
        setError(result.message || 'Top-up failed');
      }
    } catch (err) {
      console.error('Top-up error:', err);
      setError('An error occurred during top-up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <Heading>Top-Up Initiated</Heading>
          <p className="mt-2 text-gray-600">
            {paymentMethod === PaymentMethod.MPESA
              ? 'Check your phone to complete the M-Pesa payment'
              : 'Complete the payment on the gateway page'}
          </p>
          <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Heading>Top Up Wallet</Heading>
        <p className="mt-2 text-sm text-gray-600">
          Add funds to your organization's wallet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <Field>
          <Label>Amount (KES)</Label>
          <Input
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </Field>

        <Field>
          <Label>Payment Method</Label>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value={PaymentMethod.MPESA}>M-Pesa</option>
            <option value={PaymentMethod.CARD}>Card (Flutterwave)</option>
            <option value={PaymentMethod.BANK_ACCOUNT}>Bank Transfer (IntaSend)</option>
          </Select>
        </Field>

        {paymentMethod === PaymentMethod.MPESA && (
          <Field>
            <Label>M-Pesa Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254XXXXXXXXX"
              pattern="254[0-9]{9}"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: 254XXXXXXXXX (Kenya)
            </p>
          </Field>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Top Up'}
          </Button>
          <Button
            type="button"
            color="white"
            onClick={() => router.push('/wallet')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

### Phase 3: Organization-Specific Payment UIs

#### A. School Fee Payment Portal

**File to Create:** `/app/payments/guardian-portal/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Badge } from '@/app/components/badge';
import { getInvoices } from '@/lib/graphql/payments/queries';
import { payInvoice } from '@/lib/graphql/payments/mutations';

export default function GuardianPortalPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      // Fetch invoices for students under this guardian
      const data = await getInvoices({
        // Filter by guardian's students
      });
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    // Open payment modal with method selection
    // Support M-Pesa, Card, Bank Transfer
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Heading>School Fees Payment</Heading>

      {/* Student Selector */}
      <div className="mt-6 mb-8">
        {/* Dropdown to select which student's fees to view */}
      </div>

      {/* Pending Invoices */}
      <div className="grid gap-6">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{invoice.description}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Term: {invoice.term} | Due: {formatDate(invoice.dueDate)}
                </p>
                <div className="mt-3 space-y-1">
                  {invoice.lineItems.map((item, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{item.description}</span>
                      <span>KES {item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  KES {invoice.totalAmount.toFixed(2)}
                </div>
                <Badge color={invoice.status === 'PAID' ? 'green' : 'yellow'}>
                  {invoice.status}
                </Badge>
                {invoice.status !== 'PAID' && (
                  <Button
                    className="mt-4"
                    onClick={() => handlePayInvoice(invoice.id)}
                  >
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### B. Church Offering with QR Code

**File to Create:** `/app/payments/offering/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import QRCode from 'qrcode.react';

export default function OfferingPage() {
  const [offeringType, setOfferingType] = useState('tithe');
  const [amount, setAmount] = useState<number | null>(null);
  const [qrData, setQrData] = useState('');

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const generateOfferingQR = () => {
    const data = JSON.stringify({
      type: 'offering',
      offeringType,
      amount,
      organizationId: getOrganizationId(),
      timestamp: Date.now(),
    });
    setQrData(data);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Heading>Church Offering</Heading>

      {/* Offering Type Selector */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Button
          color={offeringType === 'tithe' ? 'dark' : 'white'}
          onClick={() => setOfferingType('tithe')}
        >
          Tithe
        </Button>
        <Button
          color={offeringType === 'offering' ? 'dark' : 'white'}
          onClick={() => setOfferingType('offering')}
        >
          Offering
        </Button>
        <Button
          color={offeringType === 'building' ? 'dark' : 'white'}
          onClick={() => setOfferingType('building')}
        >
          Building Fund
        </Button>
        <Button
          color={offeringType === 'missions' ? 'dark' : 'white'}
          onClick={() => setOfferingType('missions')}
        >
          Missions
        </Button>
      </div>

      {/* Quick Amount Buttons */}
      <div className="mt-8">
        <Label>Quick Amount Selection (KES)</Label>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {quickAmounts.map((amt) => (
            <Button
              key={amt}
              color={amount === amt ? 'dark' : 'white'}
              onClick={() => setAmount(amt)}
            >
              {amt}
            </Button>
          ))}
        </div>
      </div>

      {/* QR Code Display */}
      {qrData && (
        <div className="mt-8 text-center">
          <div className="inline-block p-8 bg-white rounded-lg shadow">
            <QRCode value={qrData} size={256} />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Scan this QR code to give {offeringType}
          </p>
        </div>
      )}

      <div className="mt-8">
        <Button onClick={generateOfferingQR}>
          Generate QR Code
        </Button>
      </div>
    </div>
  );
}
```

---

## GraphQL Integration

### Add Missing Queries

**Update:** `/lib/graphql/payments/queries.ts`

```typescript
// Add these functions if they don't exist

export async function getWalletBalance(organizationId: string) {
  const query = `
    query GetWalletBalance($organizationId: UUID!) {
      walletBalance(organizationId: $organizationId) {
        id
        organizationUuid
        balanceKes
        balanceUsd
        balanceEuro
        isActive
        createdAt
        updatedAt
      }
    }
  `;

  const response = await graphql(query, { organizationId });
  return response.walletBalance;
}

export async function getWalletTransactions(
  organizationId: string,
  filters?: { limit?: number; offset?: number; status?: string }
) {
  const query = `
    query GetWalletTransactions($organizationId: UUID!, $limit: Int, $offset: Int, $status: String) {
      walletTransactions(
        organizationId: $organizationId
        limit: $limit
        offset: $offset
        status: $status
      ) {
        id
        walletBalanceId
        transactionType
        amountKes
        status
        paymentMethod
        description
        transactionReference
        gatewayReference
        createdAt
        updatedAt
      }
    }
  `;

  const response = await graphql(query, { organizationId, ...filters });
  return response.walletTransactions;
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Can view wallet balance on dashboard
- [ ] Balance displays correctly for all currencies
- [ ] Recent transactions show with correct status badges
- [ ] Top-up flow works with M-Pesa (test phone receives STK push)
- [ ] Top-up flow works with Card (redirects to Flutterwave)
- [ ] Top-up flow works with Bank (redirects to IntaSend)
- [ ] Transaction history displays all transactions
- [ ] Organization-specific features work (school/church/real estate)
- [ ] Error messages display correctly
- [ ] Loading states work properly

### Integration Testing
- [ ] GraphQL mutations return expected responses
- [ ] Webhook callbacks update transaction status
- [ ] Balance updates after successful payment
- [ ] Receipt generation works
- [ ] QR codes display correctly

---

## Deployment Notes

1. **Environment Variables** - Ensure payment gateway credentials are set:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_CALLBACK_URL`
   - `FLUTTERWAVE_PUBLIC_KEY`
   - `INTASEND_PUBLISHABLE_KEY`

2. **SSL Certificate** - HTTPS required for payment gateways

3. **Callback URLs** - Must be publicly accessible for webhooks

4. **Testing** - Test in sandbox/staging before production

---

## Next Steps After Wallet Implementation

1. Add receipt PDF generation
2. Implement bulk invoice generation for schools
3. Add payment reminders/notifications
4. Implement recurring payments
5. Add payment analytics dashboard
6. Export transaction history (CSV/Excel)

---

**End of Guide**
