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
import {
  getWalletBalance,
  freezeWallet,
  unfreezeWallet,
  type WalletBalance
} from '@/lib/payments-api';
import {
  WalletIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon
} from '@heroicons/react/20/solid';

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return 'KES 0.00';

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WalletPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);

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
    const loadWallet = async () => {
      if (!userInfo) return;

      setLoading(true);
      try {
        const walletData = await getWalletBalance();
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to load wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [userInfo]);

  const handleFreeze = async () => {
    if (!freezeReason.trim()) {
      alert('Please provide a reason for freezing the wallet');
      return;
    }

    setLoading(true);
    try {
      const updated = await freezeWallet(freezeReason);
      setWallet(updated);
      setShowFreezeDialog(false);
      setFreezeReason('');
    } catch (error) {
      console.error('Failed to freeze wallet:', error);
      alert('Failed to freeze wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!confirm('Are you sure you want to unfreeze this wallet?')) {
      return;
    }

    setLoading(true);
    try {
      const updated = await unfreezeWallet();
      setWallet(updated);
    } catch (error) {
      console.error('Failed to unfreeze wallet:', error);
      alert('Failed to unfreeze wallet. Please try again.');
    } finally {
      setLoading(false);
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
          <Heading>Organization Wallet</Heading>
          <Text>Manage your organization's wallet balance and settings</Text>
        </div>
        <div className="flex gap-3">
          {wallet && !wallet.isFrozen && (
            <Button onClick={() => setShowFreezeDialog(true)} outline color="red">
              <LockClosedIcon className="h-4 w-4" />
              Freeze Wallet
            </Button>
          )}
          {wallet && wallet.isFrozen && (
            <Button onClick={handleUnfreeze} color="blue">
              <LockOpenIcon className="h-4 w-4" />
              Unfreeze Wallet
            </Button>
          )}
        </div>
      </div>

      {loading && !wallet && (
        <div className="mt-8 flex justify-center">
          <div className="text-zinc-500">Loading wallet...</div>
        </div>
      )}

      {!loading && !wallet && (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <WalletIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Heading level={3} className="mt-4">No Wallet Found</Heading>
          <Text className="mt-2 text-zinc-500">
            Your organization doesn't have a wallet yet. It will be automatically created when you make your first payment.
          </Text>
        </div>
      )}

      {wallet && (
        <>
          {/* Wallet Status Banner */}
          {wallet.isFrozen && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start">
                <LockClosedIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="ml-3">
                  <Heading level={3} className="text-red-800 dark:text-red-300">
                    Wallet Frozen
                  </Heading>
                  <Text className="mt-1 text-red-700 dark:text-red-400">
                    {wallet.frozenReason || 'No reason provided'}
                  </Text>
                  <Text className="mt-1 text-sm text-red-600 dark:text-red-500">
                    Frozen on {formatDate(wallet.frozenAt)}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Balance Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Balance */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-zinc-500">Total Balance</Text>
                <WalletIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <Heading level={2} className="mt-2">{formatCurrency(wallet.balanceKes)}</Heading>
              <Text className="mt-1 text-xs text-zinc-500">
                As of {new Date().toLocaleDateString()}
              </Text>
            </div>

            {/* Available Balance */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-zinc-500">Available Balance</Text>
                <ArrowUpIcon className="h-5 w-5 text-green-500" />
              </div>
              <Heading level={2} className="mt-2 text-green-600">
                {formatCurrency(wallet.availableBalanceKes)}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500">
                Ready for transactions
              </Text>
            </div>

            {/* Pending Balance */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-zinc-500">Pending Balance</Text>
                <ClockIcon className="h-5 w-5 text-amber-500" />
              </div>
              <Heading level={2} className="mt-2 text-amber-600">
                {formatCurrency(wallet.pendingBalanceKes)}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500">
                Processing transactions
              </Text>
            </div>

            {/* Daily Limit */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-zinc-500">Daily Limit</Text>
                <ArrowDownIcon className="h-5 w-5 text-blue-500" />
              </div>
              <Heading level={2} className="mt-2 text-blue-600">
                {parseFloat(wallet.dailySpendLimitKes) > 0
                  ? formatCurrency(wallet.dailySpendLimitKes)
                  : 'Unlimited'}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500">
                Spent today: {formatCurrency(wallet.dailySpentTodayKes)}
              </Text>
            </div>
          </div>

          {/* Wallet Details */}
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <Heading level={3}>Wallet Details</Heading>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Wallet ID</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{wallet.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Owner Type</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                    {wallet.ownerType.replace('_', ' ').toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Status</dt>
                  <dd className="mt-1">
                    {wallet.isActive ? (
                      <Badge color="green">Active</Badge>
                    ) : (
                      <Badge color="red">Inactive</Badge>
                    )}
                    {wallet.isFrozen && (
                      <Badge color="red" className="ml-2">Frozen</Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Created</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                    {formatDate(wallet.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                    {formatDate(wallet.updatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Daily Limit Reset</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                    {wallet.lastResetDate
                      ? new Date(wallet.lastResetDate).toLocaleDateString()
                      : 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Button href="/payments/invoices" color="blue">
              View Invoices
            </Button>
            <Button href="/payments/accounts" outline>
              Payment Accounts
            </Button>
            <Button href="/payments" outline>
              Back to Payments
            </Button>
          </div>
        </>
      )}

      {/* Freeze Wallet Dialog */}
      {showFreezeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
            <Heading level={3}>Freeze Wallet</Heading>
            <Text className="mt-2 text-zinc-500">
              Freezing the wallet will prevent all transactions. Please provide a reason.
            </Text>
            <div className="mt-4">
              <label htmlFor="freezeReason" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reason
              </label>
              <textarea
                id="freezeReason"
                rows={3}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g., Suspicious activity detected"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleFreeze} color="red" disabled={loading || !freezeReason.trim()}>
                Freeze Wallet
              </Button>
              <Button onClick={() => {
                setShowFreezeDialog(false);
                setFreezeReason('');
              }} outline>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
