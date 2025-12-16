'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Badge } from '../../components/badge';
import { Link } from '../../components/link';
import { getPaymentTransactions, getPaymentAccounts } from '@/lib/graphql/payments/queries';
import type {
  PaymentTransaction,
  PaymentStatus,
  PaymentMethod,
  PaymentAccount,
} from '@/lib/graphql/payments/types';
import { MagnifyingGlassIcon, ClipboardDocumentListIcon } from '@heroicons/react/20/solid';

function formatCurrency(amount: string, currency: string = 'KES'): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: PaymentStatus) {
  switch (status) {
    case 'COMPLETED':
      return <Badge color="green">Completed</Badge>;
    case 'PENDING':
      return <Badge color="yellow">Pending</Badge>;
    case 'FAILED':
      return <Badge color="red">Failed</Badge>;
    case 'CANCELLED':
      return <Badge color="zinc">Cancelled</Badge>;
    case 'REFUNDED':
      return <Badge color="blue">Refunded</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getMethodDisplay(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    MPESA: 'M-Pesa',
    BANK_TRANSFER: 'Bank Transfer',
    CARD: 'Card',
    CASH: 'Cash',
    WALLET: 'Wallet',
    AIRTEL_MONEY: 'Airtel Money',
  };
  return map[method] || method;
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams?.get('accountId');

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'ALL'>('ALL');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'ALL'>('ALL');
  const [filterAccountId, setFilterAccountId] = useState<string>(accountIdParam || '');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }
    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }
    setUserInfo(info);
  }, [router]);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!userInfo) return;
      try {
        const accounts = await getPaymentAccounts();
        setPaymentAccounts(accounts);
      } catch (error) {
        console.error('Failed to load payment accounts:', error);
      }
    };
    loadAccounts();
  }, [userInfo]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!userInfo) return;
      setLoading(true);
      try {
        const txList = await getPaymentTransactions({
          paymentAccountId: filterAccountId || undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          paymentMethod: filterMethod !== 'ALL' ? filterMethod : undefined,
          limit: 100,
        });
        setTransactions(txList);
        setFilteredTransactions(txList);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [userInfo, filterAccountId, filterStatus, filterMethod]);

  useEffect(() => {
    let filtered = transactions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.transactionReference.toLowerCase().includes(query) ||
          tx.payerName?.toLowerCase().includes(query) ||
          tx.payerPhone?.toLowerCase().includes(query)
      );
    }
    setFilteredTransactions(filtered);
  }, [transactions, searchQuery]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  if (!userInfo) return null;

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const completedAmount = filteredTransactions
    .filter((tx) => tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div>
        <Heading>Payment Transactions</Heading>
        <Text>View all payment transactions and their status</Text>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500">Total Transactions</Text>
          <Heading level={3} className="mt-1">
            {filteredTransactions.length}
          </Heading>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500">Total Amount</Text>
          <Heading level={3} className="mt-1">
            {formatCurrency(totalAmount.toString(), filteredTransactions[0]?.currency || 'KES')}
          </Heading>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
          <Text className="text-sm text-green-700 dark:text-green-400">Completed</Text>
          <Heading level={3} className="mt-1 text-green-900 dark:text-green-200">
            {formatCurrency(completedAmount.toString(), filteredTransactions[0]?.currency || 'KES')}
          </Heading>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500">Success Rate</Text>
          <Heading level={3} className="mt-1">
            {filteredTransactions.length > 0
              ? (
                  (filteredTransactions.filter((tx) => tx.status === 'COMPLETED').length /
                    filteredTransactions.length) *
                  100
                ).toFixed(1)
              : 0}
            %
          </Heading>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">All Accounts</option>
            {paymentAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as PaymentStatus | 'ALL')}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(['ALL', 'MPESA', 'CARD', 'BANK_TRANSFER', 'CASH'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setFilterMethod(method as PaymentMethod | 'ALL')}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                filterMethod === method
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {method === 'ALL' ? 'All Methods' : getMethodDisplay(method as PaymentMethod)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/payments/transactions/${tx.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {tx.transactionReference}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <Text className="text-sm">{getMethodDisplay(tx.paymentMethod)}</Text>
                    </td>
                    <td className="px-6 py-4">
                      <Text className="text-sm">
                        {tx.payerName || tx.payerPhone || '—'}
                      </Text>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-4">
                      <Text className="text-sm text-zinc-500">{formatDate(tx.createdAt)}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <Heading level={3} className="mt-4">
              No transactions found
            </Heading>
            <Text className="mt-2 text-zinc-500">Try adjusting your filters</Text>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
