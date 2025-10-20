'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  isStaff,
  getUserRoleDisplayName,
  getAccountTypeDisplayName,
  isAllowedUser,
  UserInfo,
  AccountType,
} from '@/lib/roles';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Badge } from '../components/badge';
import { SearchButton } from '../components/search-button';

export default function DashboardPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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

    // Double-check that user is allowed (Business or Institution)
    if (!isAllowedUser(info.userRole)) {
      localStorage.clear();
      router.push('/login');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local storage anyway and redirect
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
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
  const accountTypeDisplay = getAccountTypeDisplayName(userInfo.accountType);

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
        {/* Administrator View */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Stats Cards - Full Access for Administrators */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Staff</Text>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                  <Badge color="blue">New</Badge>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Registered users</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Active Sessions</Text>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                  <Badge color="green">Live</Badge>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Currently online</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Departments</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Organization units</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Revenue</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">$0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Financial overview</Text>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <Heading level={2} className="mb-4">Quick Actions</Heading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">Register Staff</div>
                  <Text className="mt-1 text-sm">Add new staff members</Text>
                </button>
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">Manage Roles</div>
                  <Text className="mt-1 text-sm">Assign roles and permissions</Text>
                </button>
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">View Reports</div>
                  <Text className="mt-1 text-sm">Access analytics and reports</Text>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff View */}
        {isStaff(userInfo.userRole) && (
          <div className="space-y-6">
            {/* Limited Stats for Staff */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">My Tasks</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pending assignments</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Completed</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tasks finished</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">My Department</Text>
                <div className="mt-2">
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">N/A</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Current assignment</Text>
              </div>
            </div>

            {/* Staff Actions */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <Heading level={2} className="mb-4">My Actions</Heading>
              <div className="grid gap-4 sm:grid-cols-2">
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">View My Tasks</div>
                  <Text className="mt-1 text-sm">See assigned tasks and deadlines</Text>
                </button>
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">Submit Report</div>
                  <Text className="mt-1 text-sm">Upload task completion reports</Text>
                </button>
              </div>
            </div>

            {/* Permission Notice */}
            <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/10 dark:ring-amber-900">
              <Text className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Some features are restricted based on your role and permissions.
                Contact your administrator for access to additional features.
              </Text>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <Heading level={2} className="mb-4">
            Welcome to {accountTypeDisplay} Desktop Application
          </Heading>
          <Text className="mb-4">
            You are logged in as <strong>{roleDisplayName}</strong>. This dashboard is customized
            based on your role and permissions within the organization.
          </Text>
          <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200 dark:bg-blue-950/10 dark:ring-blue-900">
            <Text className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Account Type:</strong> {accountTypeDisplay}
              {userInfo.organizationType && (
                <>
                  {' '}
                  | <strong>Category:</strong> {userInfo.organizationType}
                </>
              )}
            </Text>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
