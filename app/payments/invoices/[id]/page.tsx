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
import { getInvoice } from '@/lib/graphql/payments/queries';
import { cancelInvoice, initiateMpesaPayment } from '@/lib/graphql/payments/mutations';
import type { Invoice } from '@/lib/graphql/payments/types';
import { ArrowLeftIcon, DocumentDuplicateIcon } from '@heroicons/react/20/solid';

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
    month: 'long',
    day: 'numeric',
  });
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
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
    const loadInvoiceData = async () => {
      if (!userInfo || !invoiceId) return;
      setLoading(true);
      try {
        const invoiceData = await getInvoice(invoiceId);
        if (invoiceData) {
          setInvoice(invoiceData);
        } else {
          setError('Invoice not found');
        }
      } catch (error) {
        console.error('Failed to load invoice:', error);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    loadInvoiceData();
  }, [userInfo, invoiceId]);

  const handleCancelInvoice = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await cancelInvoice(invoiceId);
      if (result.success && result.invoice) {
        setInvoice(result.invoice);
      } else {
        setError(result.message || 'Failed to cancel invoice');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber) {
      setError('Please enter phone number');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const result = await initiateMpesaPayment(invoiceId, phoneNumber);
      if (result.success) {
        alert('M-Pesa STK Push sent! Please check your phone.');
        setShowPaymentDialog(false);
      } else {
        setError(result.message || 'Failed to initiate payment');
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
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
            <Text className="mt-4">Loading invoice...</Text>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error && !invoice) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
        </div>
        <Button href="/payments/invoices" className="mt-4">Back to Invoices</Button>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/payments/invoices" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Invoices</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
        </div>
      )}

      {invoice && (
        <div className="max-w-4xl">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <DocumentDuplicateIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <Heading level={1}>Invoice {invoice.invoiceNumber}</Heading>
                    <Text className="text-zinc-500">
                      Created {formatDate(invoice.createdAt)}
                    </Text>
                  </div>
                </div>
              </div>
              <Badge
                color={
                  invoice.status === 'PAID'
                    ? 'green'
                    : invoice.status === 'OVERDUE'
                    ? 'red'
                    : invoice.status === 'PENDING'
                    ? 'yellow'
                    : 'zinc'
                }
              >
                {invoice.status}
              </Badge>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <Text className="text-sm font-medium text-zinc-500">From</Text>
                <Text className="mt-1 font-medium">
                  {invoice.paymentAccount?.accountName || 'Payment Account'}
                </Text>
                <Text className="text-sm text-zinc-500">
                  {invoice.paymentAccount?.accountNumber}
                </Text>
              </div>
              <div>
                <Text className="text-sm font-medium text-zinc-500">Bill To</Text>
                <Text className="mt-1 font-medium">{invoice.recipientName || 'N/A'}</Text>
                {invoice.recipientEmail && (
                  <Text className="text-sm text-zinc-500">{invoice.recipientEmail}</Text>
                )}
                {invoice.recipientPhone && (
                  <Text className="text-sm text-zinc-500">{invoice.recipientPhone}</Text>
                )}
              </div>
            </div>

            {invoice.description && (
              <div className="mt-6">
                <Text className="text-sm font-medium text-zinc-500">Description</Text>
                <Text className="mt-1">{invoice.description}</Text>
              </div>
            )}

            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div className="mt-8">
                <table className="w-full">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="pb-3 text-left text-sm font-medium text-zinc-500">Description</th>
                      <th className="pb-3 text-right text-sm font-medium text-zinc-500">Qty</th>
                      <th className="pb-3 text-right text-sm font-medium text-zinc-500">Price</th>
                      <th className="pb-3 text-right text-sm font-medium text-zinc-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 text-sm">{item.description}</td>
                        <td className="py-3 text-right text-sm">{item.quantity}</td>
                        <td className="py-3 text-right text-sm">
                          {formatCurrency(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-3 text-right text-sm font-medium">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <div className="w-64">
                <div className="flex justify-between">
                  <Text className="font-medium">Total Amount</Text>
                  <Heading level={2} className="text-2xl">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </Heading>
                </div>
                {invoice.dueDate && (
                  <Text className="mt-2 text-right text-sm text-zinc-500">
                    Due: {formatDate(invoice.dueDate)}
                  </Text>
                )}
              </div>
            </div>

            {invoice.status === 'PENDING' && (
              <div className="mt-8 flex gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <Button color="blue" onClick={() => setShowPaymentDialog(true)}>
                  Pay with M-Pesa
                </Button>
                <Button outline onClick={handleCancelInvoice} disabled={processing}>
                  Cancel Invoice
                </Button>
              </div>
            )}

            {invoice.status === 'PAID' && invoice.paidAt && (
              <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
                <Text className="font-medium text-green-800 dark:text-green-200">
                  Paid on {formatDate(invoice.paidAt)}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3}>Pay with M-Pesa</Heading>
            <Text className="mt-2">Enter phone number to receive STK Push</Text>
            <input
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-4 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="mt-6 flex gap-4">
              <Button color="blue" onClick={handleMpesaPayment} disabled={processing}>
                {processing ? 'Processing...' : 'Send STK Push'}
              </Button>
              <Button outline onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
