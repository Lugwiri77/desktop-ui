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
import { Button } from '../../components/button';
import { Link } from '../../components/link';
import { getInvoices, getPaymentAccounts } from '@/lib/graphql/payments/queries';
import type { Invoice, InvoiceStatus, PaymentAccount } from '@/lib/graphql/payments/types';
import { PlusIcon, MagnifyingGlassIcon, DocumentDuplicateIcon } from '@heroicons/react/20/solid';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';
import {
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  type InvoiceStatus as UtilInvoiceStatus,
} from '@/lib/payment-utils';

function getInvoiceStatusBadge(status: InvoiceStatus, dueDate?: string) {
  // Check if pending invoice is overdue
  if (status === 'PENDING' && dueDate && new Date(dueDate) < new Date()) {
    return <Badge color="red">Overdue</Badge>;
  }

  // Map GraphQL status to util status
  const utilStatus = status.toLowerCase() as UtilInvoiceStatus;
  const color = getInvoiceStatusColor(utilStatus);
  const label = getInvoiceStatusLabel(utilStatus);
  return <Badge color={color}>{label}</Badge>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams?.get('accountId');

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'ALL'>('ALL');
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
    const loadInvoices = async () => {
      if (!userInfo) return;
      setLoading(true);
      try {
        const invoicesList = await getInvoices({
          paymentAccountId: filterAccountId || undefined,
          limit: 100,
        });
        setInvoices(invoicesList);
        setFilteredInvoices(invoicesList);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, [userInfo, filterAccountId]);

  useEffect(() => {
    let filtered = invoices;
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((invoice) => invoice.status === filterStatus);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.recipientName?.toLowerCase().includes(query) ||
          invoice.description?.toLowerCase().includes(query)
      );
    }
    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, filterStatus]);

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

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Invoices</Heading>
          <Text>Manage and track all invoices</Text>
        </div>
        <Button href="/payments/invoices/create" color="blue">
          <PlusIcon className="h-5 w-5" />
          <span className="ml-2">Generate Invoice</span>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Amount</Text>
          <Heading level={3} className="mt-1">
            {formatCurrency(totalAmount.toString(), filteredInvoices[0]?.currency || 'KES')}
          </Heading>
          <Text className="text-xs text-zinc-500">{filteredInvoices.length} invoices</Text>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
          <Text className="text-sm text-green-700 dark:text-green-400">Paid</Text>
          <Heading level={3} className="mt-1 text-green-900 dark:text-green-200">
            {formatCurrency(paidAmount.toString(), filteredInvoices[0]?.currency || 'KES')}
          </Heading>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/50">
          <Text className="text-sm text-yellow-700 dark:text-yellow-400">Pending/Overdue</Text>
          <Heading level={3} className="mt-1 text-yellow-900 dark:text-yellow-200">
            {formatCurrency(pendingAmount.toString(), filteredInvoices[0]?.currency || 'KES')}
          </Heading>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
          {(['ALL', 'PENDING', 'PAID', 'OVERDUE', 'DRAFT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as InvoiceStatus | 'ALL')}
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
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/payments/invoices/${invoice.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Text className="font-medium">{invoice.recipientName || 'N/A'}</Text>
                      {invoice.recipientEmail && (
                        <Text className="text-xs text-zinc-500">{invoice.recipientEmail}</Text>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4">
                      {invoice.dueDate ? (
                        <Text
                          className={
                            new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </Text>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getInvoiceStatusBadge(invoice.status, invoice.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <Heading level={3} className="mt-4">
              No invoices found
            </Heading>
            <Text className="mt-2 text-zinc-500">
              {searchQuery || filterStatus !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Generate your first invoice'}
            </Text>
            {!searchQuery && filterStatus === 'ALL' && (
              <Button href="/payments/invoices/create" className="mt-6" color="blue">
                Generate Invoice
              </Button>
            )}
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
