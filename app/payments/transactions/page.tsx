'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

export default function TransactionsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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
      <div>
        <Heading>Payment Transactions</Heading>
        <Text>View all payment transactions and their status</Text>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
        <ExclamationCircleIcon className="h-16 w-16 text-zinc-400" />
        <Heading level={2} className="mt-6">
          Feature Not Available
        </Heading>
        <Text className="mt-2 max-w-lg text-zinc-500">
          Transaction tracking is not currently available for the invoice-based payment system.
          This feature is designed for wallet transactions, which is part of a separate system.
          Use the Invoices page to track your payment activities.
        </Text>
        <div className="mt-8 flex gap-4">
          <Button href="/payments" color="blue">
            Back to Payments
          </Button>
          <Button href="/payments/invoices" outline>
            View Invoices
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
