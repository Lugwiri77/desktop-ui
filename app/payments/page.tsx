'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Link } from '../components/link';
import {
  getPaymentStatistics,
  getPaymentTransactions,
  getPaymentAccounts,
} from '@/lib/graphql/payments/queries';
import type {
  PaymentStatistics,
  PaymentTransaction,
  PaymentAccount,
  PaymentStatus,
  PaymentMethod,
} from '@/lib/graphql/payments/types';
import {
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';
import {
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  type PaymentStatus as UtilPaymentStatus,
} from '@/lib/payment-utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level={2} className="text-3xl font-semibold">
              {value}
            </Heading>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          {subtitle && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</Text>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function getPaymentStatusBadge(status: PaymentStatus) {
  // Map GraphQL status to util status (handle case differences)
  const utilStatus = status.toLowerCase() as UtilPaymentStatus;
  const color = getPaymentStatusColor(utilStatus);
  const label = getPaymentStatusLabel(utilStatus);
  return <Badge color={color}>{label}</Badge>;
}

function getPaymentMethodDisplay(method: PaymentMethod): string {
  // Handle additional payment methods not in utils
  if (method === 'BANK_TRANSFER') return 'Bank Transfer';
  if (method === 'WALLET') return 'Wallet';
  if (method === 'AIRTEL_MONEY') return 'Airtel Money';

  // Use utility function for standard methods
  return getPaymentMethodLabel(method as any) || method;
}

export default function PaymentDashboardPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Load user info
    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    // Check if user is administrator
    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  // Load payment statistics
  useEffect(() => {
    const loadStatistics = async () => {
      if (!userInfo) return;

      setLoadingStats(true);
      try {
        const stats = await getPaymentStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to load payment statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStatistics();
  }, [userInfo]);

  // Load recent transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!userInfo) return;

      setLoadingTransactions(true);
      try {
        const transactions = await getPaymentTransactions({
          limit: 10,
          offset: 0,
        });
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, [userInfo]);

  // Load payment accounts
  useEffect(() => {
    const loadAccounts = async () => {
      if (!userInfo) return;

      setLoadingAccounts(true);
      try {
        const accounts = await getPaymentAccounts();
        setPaymentAccounts(accounts);
      } catch (error) {
        console.error('Failed to load payment accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [userInfo]);

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

  if (!userInfo) {
    return null;
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Payment Dashboard</Heading>
          <Text>Overview of your organization's payment activities</Text>
        </div>
        <div className="flex gap-2">
          <Button href="/payments/invoices/create" color="blue">
            Generate Invoice
          </Button>
          <Button href="/payments/accounts/create" outline>
            New Payment Account
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </>
        ) : statistics ? (
          <>
            <StatCard
              title="Total Collected"
              value={formatCurrency(statistics.totalCollected, statistics.currency)}
              subtitle={`${statistics.transactionCount} transactions`}
              icon={BanknotesIcon}
              color="green"
              trend="up"
            />
            <StatCard
              title="Pending Payments"
              value={formatCurrency(statistics.totalPending, statistics.currency)}
              subtitle="Awaiting confirmation"
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard
              title="Overdue Amount"
              value={formatCurrency(statistics.totalOverdue, statistics.currency)}
              subtitle="Requires attention"
              icon={ExclamationTriangleIcon}
              color="red"
            />
            <StatCard
              title="Success Rate"
              value={`${statistics.successRate.toFixed(1)}%`}
              subtitle={`Avg: ${formatCurrency(statistics.averageTransactionAmount, statistics.currency)}`}
              icon={CheckCircleIcon}
              color="blue"
              trend={statistics.successRate >= 95 ? 'up' : statistics.successRate >= 85 ? 'neutral' : 'down'}
            />
          </>
        ) : (
          <div className="col-span-4">
            <Text className="text-center text-zinc-500">No payment statistics available</Text>
          </div>
        )}
      </div>

      {/* Payment Accounts Overview */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Heading level={3}>Payment Accounts</Heading>
          <Link href="/payments/accounts">View all →</Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingAccounts ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </>
          ) : paymentAccounts.length > 0 ? (
            paymentAccounts.slice(0, 6).map((account) => (
              <Link
                key={account.id}
                href={`/payments/accounts/${account.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Text className="font-medium">{account.accountName}</Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {account.accountNumber}
                    </Text>
                  </div>
                  <Badge color={account.isActive ? 'green' : 'zinc'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-2">
                  <Text className="text-lg font-semibold">
                    {formatCurrency(account.balance, account.currency)}
                  </Text>
                  {account.ownerName && (
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {account.ownerName}
                    </Text>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3">
              <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                <CreditCardIcon className="mx-auto h-12 w-12 text-zinc-400" />
                <Heading level={4} className="mt-4">
                  No payment accounts yet
                </Heading>
                <Text className="mt-2 text-zinc-500">
                  Create a payment account to start receiving payments
                </Text>
                <Button href="/payments/accounts/create" className="mt-4" color="blue">
                  Create Payment Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Heading level={3}>Recent Transactions</Heading>
          <Link href="/payments/transactions">View all →</Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loadingTransactions ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          ) : recentTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Payer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/payments/transactions/${transaction.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {transaction.transactionReference}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-medium">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm">
                        {getPaymentMethodDisplay(transaction.paymentMethod)}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getPaymentStatusBadge(transaction.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(transaction.createdAt, 'datetime')}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm">
                        {transaction.payerName || transaction.payerPhone || '—'}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">
                No transactions yet
              </Heading>
              <Text className="mt-2 text-zinc-500">
                Transactions will appear here once payments are received
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Heading level={3}>Quick Actions</Heading>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button href="/payments/invoices" outline className="justify-start">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="ml-2">Manage Invoices</span>
          </Button>
          <Button href="/payments/arrears" outline className="justify-start">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="ml-2">View Arrears</span>
          </Button>
          <Button href="/payments/reconciliation" outline className="justify-start">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="ml-2">Reconcile Payments</span>
          </Button>
          <Button href="/payments/accounts" outline className="justify-start">
            <CreditCardIcon className="h-5 w-5" />
            <span className="ml-2">Payment Accounts</span>
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
