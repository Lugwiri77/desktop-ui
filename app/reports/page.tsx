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
import { DocumentChartBarIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
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
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        <div>
          <Heading>Reports</Heading>
          <Text className="mt-2">Generate and view various reports and analytics</Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Staff Reports
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              View staff performance, attendance, and activity reports
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Financial Reports
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Generate financial summaries, revenue, and expense reports
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Department Reports
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Analyze department-wise performance and productivity
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Custom Reports
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Create custom reports based on your specific needs
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Audit Logs
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              View system audit logs and user activity history
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <DocumentChartBarIcon className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
              Export Reports
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Export reports in various formats (PDF, Excel, CSV)
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
