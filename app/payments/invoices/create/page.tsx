'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../../components/application-layout';
import { Heading } from '../../../components/heading';
import { Text } from '../../../components/text';
import { Button } from '../../../components/button';
import { getPaymentAccounts } from '@/lib/graphql/payments/queries';
import { createInvoice } from '@/lib/graphql/payments/mutations';
import type {
  CreateInvoiceInput,
  PaymentAccount,
  CreateInvoiceLineItemInput,
} from '@/lib/graphql/payments/types';
import { AccountType } from '@/lib/graphql/payments/types';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { DatePicker } from '@/app/components/DatePicker';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateInvoiceInput>({
    paymentAccountId: '',
    recipientAccountType: AccountType.PERSONAL,
    recipientAccountId: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    amount: '',
    currency: 'KES',
    description: '',
    dueDate: '',
    lineItems: [],
  });

  const [lineItems, setLineItems] = useState<CreateInvoiceLineItemInput[]>([
    { description: '', quantity: 1, unitPrice: '' },
  ]);

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
        setPaymentAccounts(accounts.filter((a) => a.isActive));
        if (accounts.length > 0) {
          setFormData((prev) => ({ ...prev, paymentAccountId: accounts[0].id }));
        }
      } catch (error) {
        console.error('Failed to load payment accounts:', error);
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

  const handleLineItemChange = (index: number, field: keyof CreateInvoiceLineItemInput, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);

    // Calculate total amount
    const total = newItems.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice || '0');
      return sum + (unitPrice * item.quantity);
    }, 0);
    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const newItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newItems);

      // Recalculate total
      const total = newItems.reduce((sum, item) => {
        const unitPrice = parseFloat(item.unitPrice || '0');
        return sum + (unitPrice * item.quantity);
      }, 0);
      setFormData((prev) => ({ ...prev, amount: total.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const invoiceData: CreateInvoiceInput = {
        ...formData,
        lineItems: lineItems.filter(item => item.description && item.unitPrice),
      };

      const result = await createInvoice(invoiceData);

      if (result.success && result.invoice) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/payments/invoices/${result.invoice!.id}`);
        }, 1500);
      } else {
        setError(result.message || 'Failed to create invoice');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/payments/invoices" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Invoices</span>
        </Button>
      </div>

      <div className="max-w-3xl">
        <Heading>Generate Invoice</Heading>
        <Text>Create a new invoice for a customer</Text>

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
            <Text className="font-medium text-green-800 dark:text-green-200">
              Invoice created successfully! Redirecting...
            </Text>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
            <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Payment Account <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.paymentAccountId}
                onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Select account</option>
                {paymentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Recipient Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.recipientAccountType}
                onChange={(e) => setFormData({ ...formData, recipientAccountType: e.target.value as AccountType })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="PERSONAL">Personal</option>
                <option value="BUSINESS">Business</option>
                <option value="INSTITUTION">Institution</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Recipient ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.recipientAccountId}
                onChange={(e) => setFormData({ ...formData, recipientAccountId: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Recipient Name
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Phone
              </label>
              <input
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <DatePicker
              label="Due Date"
              name="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              minDate={new Date().toISOString().split('T')[0]}
            />

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between">
              <Heading level={3}>Line Items</Heading>
              <Button type="button" outline onClick={addLineItem}>
                <PlusIcon className="h-5 w-5" />
                <span className="ml-2">Add Item</span>
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <Button type="button" outline onClick={() => removeLineItem(index)}>
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <Text className="text-sm text-zinc-500">Total Amount</Text>
                <Heading level={2} className="text-2xl">
                  {formData.currency} {parseFloat(formData.amount || '0').toLocaleString()}
                </Heading>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button type="button" outline onClick={() => router.push('/payments/invoices')} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
