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
import { Link } from '../../components/link';
import { getPaymentAccounts } from '@/lib/graphql/payments/queries';
import type { PaymentAccount, PaymentAccountOwnerType } from '@/lib/graphql/payments/types';
import { CreditCardIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';

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

function getOwnerTypeDisplay(ownerType: PaymentAccountOwnerType): string {
  switch (ownerType) {
    case 'BUSINESS':
      return 'Business';
    case 'INSTITUTION':
      return 'Institution';
    case 'PROPERTY':
      return 'Property';
    case 'LOCATION':
      return 'Location';
    default:
      return ownerType;
  }
}

export default function PaymentAccountsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

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

  // Load payment accounts
  useEffect(() => {
    const loadAccounts = async () => {
      if (!userInfo) return;

      setLoading(true);
      try {
        const accountsList = await getPaymentAccounts();
        setAccounts(accountsList);
        setFilteredAccounts(accountsList);
      } catch (error) {
        console.error('Failed to load payment accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [userInfo]);

  // Filter accounts based on search and status
  useEffect(() => {
    let filtered = accounts;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((account) =>
        filterStatus === 'active' ? account.isActive : !account.isActive
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.accountName.toLowerCase().includes(query) ||
          account.accountNumber.toLowerCase().includes(query) ||
          account.ownerName?.toLowerCase().includes(query)
      );
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchQuery, filterStatus]);

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
          <Heading>Payment Accounts</Heading>
          <Text>Manage payment accounts for your organization</Text>
        </div>
        <Button href="/payments/accounts/create" color="blue">
          <PlusIcon className="h-5 w-5" />
          <span className="ml-2">Create Account</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, account number, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'inactive'
                ? 'bg-zinc-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => (
              <Link
                key={account.id}
                href={`/payments/accounts/${account.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/50">
                      <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <Heading level={4} className="text-base font-semibold">
                        {account.accountName}
                      </Heading>
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        {account.accountNumber}
                      </Text>
                    </div>
                  </div>
                  <Badge color={account.isActive ? 'green' : 'zinc'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <Text className="text-2xl font-bold">
                      {formatCurrency(account.balance, account.currency)}
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      Current Balance
                    </Text>
                  </div>

                  {account.ownerName && (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        {getOwnerTypeDisplay(account.ownerType)}
                      </Text>
                      <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {account.ownerName}
                      </Text>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <CreditCardIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <Heading level={3} className="mt-4">
              {searchQuery || filterStatus !== 'all'
                ? 'No accounts found'
                : 'No payment accounts yet'}
            </Heading>
            <Text className="mt-2 text-zinc-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create a payment account to start receiving payments'}
            </Text>
            {!searchQuery && filterStatus === 'all' && (
              <Button href="/payments/accounts/create" className="mt-6" color="blue">
                <PlusIcon className="h-5 w-5" />
                <span className="ml-2">Create Your First Account</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredAccounts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Accounts</Text>
            <Heading level={3} className="mt-1">
              {filteredAccounts.length}
            </Heading>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Active Accounts</Text>
            <Heading level={3} className="mt-1">
              {filteredAccounts.filter((a) => a.isActive).length}
            </Heading>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Balance</Text>
            <Heading level={3} className="mt-1">
              {formatCurrency(
                filteredAccounts
                  .reduce((sum, account) => sum + parseFloat(account.balance), 0)
                  .toString(),
                filteredAccounts[0]?.currency || 'KES'
              )}
            </Heading>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
