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
import { getPaymentTransaction } from '@/lib/graphql/payments/queries';
import { refundPaymentTransaction } from '@/lib/graphql/payments/mutations';
import type { PaymentTransaction } from '@/lib/graphql/payments/types';
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/20/solid';

function formatCurrency(amount: string, currency: string = 'KES'): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params?.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
    const loadTransaction = async () => {
      if (!userInfo || !transactionId) return;
      setLoading(true);
      try {
        const tx = await getPaymentTransaction(transactionId);
        if (tx) {
          setTransaction(tx);
        } else {
          setError('Transaction not found');
        }
      } catch (error) {
        console.error('Failed to load transaction:', error);
        setError('Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };
    loadTransaction();
  }, [userInfo, transactionId]);

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to refund this transaction?')) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await refundPaymentTransaction(transactionId);
      if (result.success && result.transaction) {
        setTransaction(result.transaction);
      } else {
        setError(result.message || 'Failed to refund transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
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

  if (!userInfo) return null;

  if (loading) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        </div>
      </ApplicationLayout>
    );
  }

  if (error && !transaction) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
        <Button href="/payments/transactions" className="mt-4">Back</Button>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/payments/transactions" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Transactions</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {transaction && (
        <div className="max-w-3xl">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <Heading level={1}>{transaction.transactionReference}</Heading>
                  <Text className="text-zinc-500">{formatDate(transaction.createdAt)}</Text>
                </div>
              </div>
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
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <Text className="text-sm text-zinc-500">Amount</Text>
                <Heading level={2} className="mt-1 text-3xl">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </Heading>
              </div>
              <div>
                <Text className="text-sm text-zinc-500">Payment Method</Text>
                <Text className="mt-1 text-lg font-medium">{transaction.paymentMethod}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-500">Payer</Text>
                <Text className="mt-1 font-medium">
                  {transaction.payerName || transaction.payerPhone || 'N/A'}
                </Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-500">Payment Account</Text>
                <Text className="mt-1 font-medium">
                  {transaction.paymentAccount?.accountName || 'N/A'}
                </Text>
              </div>
            </div>

            {transaction.description && (
              <div className="mt-6">
                <Text className="text-sm text-zinc-500">Description</Text>
                <Text className="mt-1">{transaction.description}</Text>
              </div>
            )}

            {transaction.invoiceId && transaction.invoice && (
              <div className="mt-6">
                <Text className="text-sm text-zinc-500">Related Invoice</Text>
                <Link
                  href={`/payments/invoices/${transaction.invoiceId}`}
                  className="mt-1 block font-medium text-blue-600 hover:text-blue-700"
                >
                  {transaction.invoice.invoiceNumber}
                </Link>
              </div>
            )}

            {transaction.externalTransactionId && (
              <div className="mt-6">
                <Text className="text-sm text-zinc-500">External Transaction ID</Text>
                <Text className="mt-1 font-mono text-sm">{transaction.externalTransactionId}</Text>
              </div>
            )}

            {transaction.platformFee && (
              <div className="mt-6 grid grid-cols-2 gap-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <div>
                  <Text className="text-sm text-zinc-500">Platform Fee</Text>
                  <Text className="mt-1 font-medium">
                    {formatCurrency(transaction.platformFee, transaction.currency)}
                  </Text>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500">Net Amount</Text>
                  <Text className="mt-1 font-medium">
                    {formatCurrency(transaction.netAmount!, transaction.currency)}
                  </Text>
                </div>
              </div>
            )}

            {transaction.failureReason && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <Text className="text-sm font-medium text-red-800">Failure Reason</Text>
                <Text className="mt-1 text-sm text-red-700">{transaction.failureReason}</Text>
              </div>
            )}

            {transaction.status === 'COMPLETED' && transaction.completedAt && (
              <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <Text className="text-sm text-zinc-500">Completed At</Text>
                <Text className="mt-1">{formatDate(transaction.completedAt)}</Text>
              </div>
            )}

            {transaction.status === 'COMPLETED' && (
              <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <Button outline onClick={handleRefund} disabled={processing}>
                  {processing ? 'Processing...' : 'Refund Transaction'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
