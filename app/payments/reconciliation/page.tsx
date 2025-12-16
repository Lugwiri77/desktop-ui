'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { getPaymentTransactions } from '@/lib/graphql/payments/queries';
import { reconcilePayment, bulkReconcilePayments } from '@/lib/graphql/payments/mutations';
import type { PaymentTransaction } from '@/lib/graphql/payments/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

function formatCurrency(amount: string, currency: string = 'KES'): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReconciliationPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [unreconciled, setUnreconciled] = useState<PaymentTransaction[]>([]);
  const [reconciled, setReconciled] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For manual reconciliation
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [externalTxId, setExternalTxId] = useState('');
  const [platformFee, setPlatformFee] = useState('');
  const [processing, setProcessing] = useState(false);

  // For bulk reconciliation
  const [csvData, setCsvData] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);

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
    const loadTransactions = async () => {
      if (!userInfo) return;
      setLoading(true);
      try {
        const allTx = await getPaymentTransactions({ limit: 100 });
        const unreconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && !tx.externalTransactionId);
        const reconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && tx.externalTransactionId);
        setUnreconciled(unreconciledTx);
        setReconciled(reconciledTx);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [userInfo]);

  const handleReconcile = async () => {
    if (!selectedTx || !externalTxId) {
      setError('Please provide external transaction ID');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const netAmount = platformFee
        ? (parseFloat(selectedTx.amount) - parseFloat(platformFee)).toString()
        : undefined;

      const result = await reconcilePayment(
        selectedTx.id,
        externalTxId,
        platformFee || undefined,
        netAmount
      );

      if (result.success) {
        setSuccess('Transaction reconciled successfully');
        setSelectedTx(null);
        setExternalTxId('');
        setPlatformFee('');

        // Refresh transactions
        const allTx = await getPaymentTransactions({ limit: 100 });
        const unreconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && !tx.externalTransactionId);
        const reconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && tx.externalTransactionId);
        setUnreconciled(unreconciledTx);
        setReconciled(reconciledTx);
      } else {
        setError(result.message || 'Failed to reconcile transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReconcile = async () => {
    if (!csvData) {
      setError('Please provide CSV data');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await bulkReconcilePayments(csvData);
      if (result.success) {
        setSuccess(`Reconciled ${result.reconciledCount} transactions. Failed: ${result.failedCount}`);
        setCsvData('');
        setShowBulkDialog(false);

        // Refresh transactions
        const allTx = await getPaymentTransactions({ limit: 100 });
        const unreconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && !tx.externalTransactionId);
        const reconciledTx = allTx.filter((tx) => tx.status === 'COMPLETED' && tx.externalTransactionId);
        setUnreconciled(unreconciledTx);
        setReconciled(reconciledTx);
      } else {
        setError(result.message || 'Failed to bulk reconcile');
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

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Payment Reconciliation</Heading>
          <Text>Match internal transactions with external payment records</Text>
        </div>
        <Button outline onClick={() => setShowBulkDialog(true)}>
          Bulk Reconcile (CSV)
        </Button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <Text className="text-green-800">{success}</Text>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/50">
          <div className="flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 text-yellow-600" />
            <Text className="font-medium text-yellow-800 dark:text-yellow-200">Unreconciled</Text>
          </div>
          <Heading level={2} className="mt-2 text-3xl text-yellow-900 dark:text-yellow-100">
            {unreconciled.length}
          </Heading>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <Text className="font-medium text-green-800 dark:text-green-200">Reconciled</Text>
          </div>
          <Heading level={2} className="mt-2 text-3xl text-green-900 dark:text-green-100">
            {reconciled.length}
          </Heading>
        </div>
      </div>

      <div className="mt-8">
        <Heading level={3}>Unreconciled Transactions</Heading>
        {loading ? (
          <div className="mt-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : unreconciled.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {unreconciled.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 font-medium">{tx.transactionReference}</td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">{tx.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Button outline onClick={() => setSelectedTx(tx)}>
                        Reconcile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <Text className="mt-2 text-zinc-500">All transactions are reconciled!</Text>
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3}>Reconcile Transaction</Heading>
            <div className="mt-4 space-y-4">
              <div>
                <Text className="text-sm text-zinc-500">Transaction Reference</Text>
                <Text className="font-medium">{selectedTx.transactionReference}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-500">Amount</Text>
                <Text className="font-medium">
                  {formatCurrency(selectedTx.amount, selectedTx.currency)}
                </Text>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  External Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={externalTxId}
                  onChange={(e) => setExternalTxId(e.target.value)}
                  placeholder="e.g., MPESA123456"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Platform Fee (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  placeholder="0.00"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button color="blue" onClick={handleReconcile} disabled={processing}>
                {processing ? 'Processing...' : 'Reconcile'}
              </Button>
              <Button outline onClick={() => setSelectedTx(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3}>Bulk Reconciliation (CSV)</Heading>
            <Text className="mt-2 text-sm text-zinc-500">
              Format: transaction_reference,external_id,platform_fee
            </Text>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              placeholder="TXN001,MPESA123,50.00&#10;TXN002,MPESA124,50.00"
              className="mt-4 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="mt-6 flex gap-4">
              <Button color="blue" onClick={handleBulkReconcile} disabled={processing}>
                {processing ? 'Processing...' : 'Reconcile All'}
              </Button>
              <Button outline onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
