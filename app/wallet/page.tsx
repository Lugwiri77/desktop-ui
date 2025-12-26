'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Badge } from '@/app/components/badge';
import { Text } from '@/app/components/text';
import { getWalletBalance, getPaymentTransactions } from '@/lib/graphql/payments/queries';
import { isEducationInstitution, isPrimaryOrSecondarySchool, isUniversityOrCollege } from '@/lib/roles';
import type { UserInfo } from '@/lib/roles';

interface WalletBalance {
  accountType: string;
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

interface PaymentTransaction {
  id: string;
  transactionReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  description: string;
  payerName?: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Load user info from localStorage
    if (typeof window !== 'undefined') {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        setUserInfo(parsed);
        loadWalletData(parsed);
      } else {
        setError('User information not found');
        setLoading(false);
      }
    }
  }, []);

  const loadWalletData = async (user: UserInfo) => {
    if (!user.organizationId) {
      setError('Organization ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch balance
      const balanceData = await getWalletBalance(user.accountType, user.organizationId);
      setBalance(balanceData);

      // Fetch recent transactions
      const transactionsData = await getPaymentTransactions({ limit: 10 });
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
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency || 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = () => {
    if (!userInfo) return 'Top Up';

    if (isEducationInstitution(userInfo.accountType, userInfo.organizationType)) {
      return 'Receive School Fees';
    }

    if (userInfo.organizationType?.toLowerCase().includes('church') ||
        userInfo.organizationType?.toLowerCase().includes('religious')) {
      return 'Receive Offerings';
    }

    if (userInfo.realEstateBusinessSubcategory) {
      return 'Receive Rent Payment';
    }

    return 'Top Up Wallet';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <Text className="mt-4">Loading wallet...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <Heading level={2} className="text-red-600">{error}</Heading>
          <Button className="mt-4" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Heading>Wallet</Heading>
        <Text className="mt-2">
          Manage your organization's wallet balance and transactions
        </Text>
      </div>

      {/* Balance Card */}
      <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <Text className="text-sm font-medium text-blue-100">Available Balance</Text>
        <div className="mt-2 text-5xl font-bold">
          {balance ? formatCurrency(balance.balance, balance.currency) : formatCurrency(0, 'KES')}
        </div>
        <Text className="mt-2 text-sm text-blue-100">
          {balance?.accountName || userInfo?.organizationName || 'Organization Wallet'}
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Button
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/wallet/topup')}
        >
          <span className="text-2xl">💰</span>
          <span>{getPaymentMethodLabel()}</span>
        </Button>

        <Button
          color="white"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/wallet/transfer')}
        >
          <span className="text-2xl">💸</span>
          <span>Transfer Funds</span>
        </Button>

        <Button
          color="white"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/wallet/transactions')}
        >
          <span className="text-2xl">📊</span>
          <span>View All Transactions</span>
        </Button>
      </div>

      {/* Organization-Specific Quick Actions */}
      {userInfo && (
        <div className="mb-8">
          <Heading level={3} className="mb-4">Quick Actions</Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isEducationInstitution(userInfo.accountType, userInfo.organizationType) && (
              <>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/payments/invoices/create?type=school_fees')}
                >
                  🎓 Generate Fee Invoice
                </Button>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/payments/arrears')}
                >
                  📋 View Fee Arrears
                </Button>
              </>
            )}

            {(userInfo.organizationType?.toLowerCase().includes('church') ||
              userInfo.organizationType?.toLowerCase().includes('religious')) && (
              <>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/wallet/offering')}
                >
                  ⛪ Offering QR Code
                </Button>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/wallet/contributions')}
                >
                  📊 Contribution Report
                </Button>
              </>
            )}

            {userInfo.realEstateBusinessSubcategory && (
              <>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/payments/invoices/create?type=rent')}
                >
                  🏠 Generate Rent Invoice
                </Button>
                <Button
                  color="white"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/payments/arrears?type=rent')}
                >
                  📋 Rent Arrears
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 p-6">
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

        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <Text className="text-gray-500">No transactions yet</Text>
              <Text className="mt-2 text-sm text-gray-400">
                Your transaction history will appear here
              </Text>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/payments/transactions/${tx.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {tx.description || 'Payment Transaction'}
                      </div>
                      <Badge color={getStatusBadgeColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span>{tx.paymentMethod}</span>
                      <span>•</span>
                      <span>{formatDate(tx.createdAt)}</span>
                      {tx.payerName && (
                        <>
                          <span>•</span>
                          <span>{tx.payerName}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Ref: {tx.transactionReference}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(tx.amount, tx.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
