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
import { createPaymentAccount } from '@/lib/graphql/payments/mutations';
import {
  type CreatePaymentAccountInput,
  PaymentAccountOwnerType,
} from '@/lib/graphql/payments/types';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function CreatePaymentAccountPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentAccountInput>({
    accountName: '',
    currency: 'KES',
    ownerType: PaymentAccountOwnerType.BUSINESS,
    ownerId: '',
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

    // Pre-fill owner ID if available
    if (info.organizationId) {
      if (info.accountType === 'Business') {
        setFormData((prev) => ({
          ...prev,
          ownerType: PaymentAccountOwnerType.BUSINESS,
          ownerId: info.organizationId!,
        }));
      } else if (info.accountType === 'Institution') {
        setFormData((prev) => ({
          ...prev,
          ownerType: PaymentAccountOwnerType.INSTITUTION,
          ownerId: info.organizationId!,
        }));
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createPaymentAccount(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/payments/accounts');
        }, 1500);
      } else {
        setError(result.message || 'Failed to create payment account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  if (!userInfo) {
    return null;
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/payments/accounts" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Accounts</span>
        </Button>
      </div>

      <div className="max-w-2xl">
        <Heading>Create Payment Account</Heading>
        <Text>Set up a new payment account to receive payments</Text>

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
            <Text className="font-medium text-green-800 dark:text-green-200">
              Payment account created successfully! Redirecting...
            </Text>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
            <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Account Name */}
          <div>
            <label
              htmlFor="accountName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountName"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="e.g., Rent Payments, Tuition Fees"
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <Text className="mt-1 text-xs text-zinc-500">
              A descriptive name for this payment account
            </Text>
          </div>

          {/* Currency */}
          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              id="currency"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          {/* Owner Type */}
          <div>
            <label
              htmlFor="ownerType"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Owner Type <span className="text-red-500">*</span>
            </label>
            <select
              id="ownerType"
              required
              value={formData.ownerType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ownerType: e.target.value as PaymentAccountOwnerType,
                })
              }
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="BUSINESS">Business</option>
              <option value="INSTITUTION">Institution</option>
              <option value="PROPERTY">Property</option>
              <option value="LOCATION">Location</option>
            </select>
            <Text className="mt-1 text-xs text-zinc-500">
              Select the type of entity that owns this account
            </Text>
          </div>

          {/* Owner ID */}
          <div>
            <label
              htmlFor="ownerId"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Owner ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ownerId"
              required
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              placeholder="Enter the owner's ID"
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <Text className="mt-1 text-xs text-zinc-500">
              {formData.ownerType === 'BUSINESS' && 'The ID of the business'}
              {formData.ownerType === 'INSTITUTION' && 'The ID of the institution'}
              {formData.ownerType === 'PROPERTY' && 'The ID of the property'}
              {formData.ownerType === 'LOCATION' && 'The ID of the location'}
            </Text>
          </div>

          {/* Metadata (Optional) */}
          <div>
            <label
              htmlFor="metadata"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Additional Information (Optional)
            </label>
            <textarea
              id="metadata"
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              placeholder='{"purpose": "Monthly rent collection", "notes": "For Building A"}'
              rows={4}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <Text className="mt-1 text-xs text-zinc-500">
              Optional JSON metadata for additional account information
            </Text>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Payment Account'}
            </Button>
            <Button
              type="button"
              outline
              onClick={() => router.push('/payments/accounts')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
