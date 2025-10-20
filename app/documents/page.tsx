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
import { DocumentTextIcon, FolderIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function DocumentsPage() {
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
            <Heading>Documents</Heading>
            <Text className="mt-2">Manage and organize your organization's documents</Text>
          </div>
          <Button onClick={() => {}} disabled>
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Documents</p>
                  <p className="text-2xl font-semibold text-zinc-950 dark:text-white mt-1">--</p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-zinc-400" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Folders</p>
                  <p className="text-2xl font-semibold text-zinc-950 dark:text-white mt-1">--</p>
                </div>
                <FolderIcon className="h-10 w-10 text-zinc-400" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Storage Used</p>
                  <p className="text-2xl font-semibold text-zinc-950 dark:text-white mt-1">-- MB</p>
                </div>
                <ArrowUpTrayIcon className="h-10 w-10 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Document Categories */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Document Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Contracts', count: '--' },
                { name: 'Invoices', count: '--' },
                { name: 'Reports', count: '--' },
                { name: 'Policies', count: '--' },
                { name: 'Staff Documents', count: '--' },
                { name: 'Legal', count: '--' },
                { name: 'Financial', count: '--' },
                { name: 'Other', count: '--' },
              ].map((category) => (
                <button
                  key={category.name}
                  disabled
                  className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderIcon className="h-6 w-6 text-zinc-500 mb-2" />
                  <p className="text-sm font-medium text-zinc-950 dark:text-white">{category.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {category.count} documents
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Documents Placeholder */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Recent Documents
            </h3>
            <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <DocumentTextIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400">
                Document management functionality coming soon.
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
                This feature will allow you to upload, organize, and manage all your organization's documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
