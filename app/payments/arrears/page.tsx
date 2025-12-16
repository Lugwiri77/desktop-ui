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
import { Link } from '../../components/link';
import { getAllArrearsReports } from '@/lib/graphql/payments/queries';
import type { ArrearsReport } from '@/lib/graphql/payments/types';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';

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

export default function ArrearsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reports, setReports] = useState<ArrearsReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ArrearsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const loadReports = async () => {
      if (!userInfo) return;
      setLoading(true);
      try {
        const reportsList = await getAllArrearsReports();
        setReports(reportsList);
      } catch (error) {
        console.error('Failed to load arrears reports:', error);
        setError('Failed to load arrears reports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
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

  if (!userInfo) return null;

  const totalArrears = reports.reduce((sum, r) => sum + parseFloat(r.totalArrears), 0);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div>
        <Heading>Arrears Management</Heading>
        <Text>Track and manage overdue payments</Text>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/50">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          <div>
            <Heading level={2} className="text-2xl text-red-900 dark:text-red-200">
              {formatCurrency(totalArrears.toString())}
            </Heading>
            <Text className="text-red-700 dark:text-red-300">Total Outstanding Arrears</Text>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Heading level={3}>Arrears by Payment Account</Heading>
        {loading ? (
          <div className="mt-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Heading level={4}>
                      {report.paymentAccount?.accountName || 'Payment Account'}
                    </Heading>
                    <Text className="text-xs text-zinc-500">
                      {report.paymentAccount?.accountNumber}
                    </Text>
                  </div>
                  <Badge color="red">{report.overdueInvoices.length} Overdue</Badge>
                </div>
                <div className="mt-4">
                  <Text className="text-sm text-zinc-500">Total Arrears</Text>
                  <Heading level={3} className="mt-1 text-2xl text-red-600 dark:text-red-400">
                    {formatCurrency(report.totalArrears)}
                  </Heading>
                </div>
                <Text className="mt-2 text-xs text-zinc-500">
                  Generated {formatDate(report.generatedAt)}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 p-12 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <Heading level={3} className="mt-4">
              No arrears found
            </Heading>
            <Text className="mt-2 text-zinc-500">All payments are up to date!</Text>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="mt-8">
          <Heading level={3}>Overdue Invoices - {selectedReport.paymentAccount?.accountName}</Heading>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedReport.overdueInvoices.map((invoice) => {
                  const daysOverdue = invoice.dueDate
                    ? Math.floor(
                        (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0;
                  return (
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
                        <Text>{invoice.recipientName || 'N/A'}</Text>
                      </td>
                      <td className="px-6 py-4 font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Text className="text-sm">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color="red">{daysOverdue} days</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
