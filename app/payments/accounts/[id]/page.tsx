'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../../components/application-layout';
import { Heading } from '../../../components/heading';
import { Text } from '../../../components/text';
import { Badge } from '../../../components/badge';
import { Button } from '../../../components/button';
import { Link } from '../../../components/link';
import {
  getPaymentAccount,
  getPaymentTransactions,
  getInvoices,
} from '@/lib/graphql/payments/queries';
import {
  updatePaymentAccount,
  deletePaymentAccount,
} from '@/lib/graphql/payments/mutations';
import type {
  PaymentAccount,
  PaymentTransaction,
  Invoice,
  UpdatePaymentAccountInput,
} from '@/lib/graphql/payments/types';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CreditCardIcon,
} from '@heroicons/react/20/solid';

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
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PaymentAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<UpdatePaymentAccountInput>({
    accountId: accountId,
    accountName: '',
    isActive: true,
    metadata: '',
  });

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

  // Load account details
  useEffect(() => {
    const loadAccountData = async () => {
      if (!userInfo || !accountId) return;

      setLoading(true);
      try {
        const accountData = await getPaymentAccount(accountId);
        if (accountData) {
          setAccount(accountData);
          setEditForm({
            accountId: accountData.id,
            accountName: accountData.accountName,
            isActive: accountData.isActive,
            metadata: accountData.metadata || '',
          });

          // Load recent transactions
          const transactions = await getPaymentTransactions({
            paymentAccountId: accountId,
            limit: 5,
          });
          setRecentTransactions(transactions);

          // Load recent invoices
          const invoices = await getInvoices({
            paymentAccountId: accountId,
            limit: 5,
          });
          setRecentInvoices(invoices);
        } else {
          setError('Payment account not found');
        }
      } catch (error) {
        console.error('Failed to load account:', error);
        setError('Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [userInfo, accountId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await updatePaymentAccount(editForm);
      if (result.success && result.paymentAccount) {
        setAccount(result.paymentAccount);
        setEditing(false);
      } else {
        setError(result.message || 'Failed to update account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deletePaymentAccount(accountId);
      if (result.success) {
        router.push('/payments/accounts');
      } else {
        setError(result.message || 'Failed to delete account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(false);
    }
  };

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

  if (loading) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
            <Text className="mt-4">Loading account details...</Text>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error && !account) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
        </div>
        <Button href="/payments/accounts" className="mt-4">
          Back to Accounts
        </Button>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/payments/accounts" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Accounts</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
        </div>
      )}

      {account && (
        <>
          {/* Account Header */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/50">
                  <CreditCardIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Heading level={2}>{account.accountName}</Heading>
                    <Badge color={account.isActive ? 'green' : 'zinc'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Text className="mt-1 text-zinc-500 dark:text-zinc-400">
                    {account.accountNumber}
                  </Text>
                  {account.ownerName && (
                    <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {account.ownerType} • {account.ownerName}
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button outline onClick={() => setEditing(!editing)}>
                  <PencilIcon className="h-5 w-5" />
                  <span className="ml-2">{editing ? 'Cancel' : 'Edit'}</span>
                </Button>
                <Button
                  outline
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span className="ml-2">{deleting ? 'Deleting...' : 'Delete'}</span>
                </Button>
              </div>
            </div>

            {/* Balance */}
            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">Current Balance</Text>
              <Heading level={1} className="mt-2 text-4xl">
                {formatCurrency(account.balance, account.currency)}
              </Heading>
            </div>

            {/* Edit Form */}
            {editing && (
              <form onSubmit={handleUpdate} className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={editForm.accountName}
                    onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Account is active
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Metadata (JSON)
                  </label>
                  <textarea
                    value={editForm.metadata}
                    onChange={(e) => setEditForm({ ...editForm, metadata: e.target.value })}
                    rows={3}
                    className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <Button type="submit" color="blue">
                  Save Changes
                </Button>
              </form>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <Heading level={3}>Recent Transactions</Heading>
              <Link href={`/payments/transactions?accountId=${account.id}`}>
                View all →
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {recentTransactions.length > 0 ? (
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/payments/transactions/${transaction.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {transaction.transactionReference}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            color={
                              transaction.status === 'COMPLETED'
                                ? 'green'
                                : transaction.status === 'PENDING'
                                ? 'yellow'
                                : 'red'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <Text className="text-zinc-500">No transactions yet</Text>
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <Heading level={3}>Recent Invoices</Heading>
              <Link href={`/payments/invoices?accountId=${account.id}`}>
                View all →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/payments/invoices/${invoice.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Text className="font-medium">{invoice.invoiceNumber}</Text>
                        <Text className="text-xs text-zinc-500">{invoice.recipientName}</Text>
                      </div>
                      <Badge
                        color={
                          invoice.status === 'PAID'
                            ? 'green'
                            : invoice.status === 'OVERDUE'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <Text className="mt-2 text-lg font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </Text>
                    {invoice.dueDate && (
                      <Text className="text-xs text-zinc-500">
                        Due: {formatDate(invoice.dueDate)}
                      </Text>
                    )}
                  </Link>
                ))
              ) : (
                <div className="col-span-3 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                  <Text className="text-zinc-500">No invoices yet</Text>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ApplicationLayout>
  );
}
