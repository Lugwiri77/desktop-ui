'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Button } from '../components/button';
import { isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import { PlusIcon } from '@heroicons/react/20/solid';

export default function DepartmentsPage() {
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
    localStorage.clear();
    router.push('/login');
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);

  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading>Departments</Heading>
            <Text className="mt-2">Manage organizational departments and their structure</Text>
          </div>
          <Button onClick={() => {}}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Department
          </Button>
        </div>

        <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <p className="text-zinc-500 dark:text-zinc-400">
            Department management functionality coming soon.
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
            This feature will allow you to create, manage, and organize departments within your organization.
          </p>
        </div>
      </div>
    </ApplicationLayout>
  );
}
