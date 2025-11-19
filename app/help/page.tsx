'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Divider } from '@/app/components/divider';
import { isAuthenticated, loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid';

export default function HelpDocumentationPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading || !userInfo) {
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

  const guides = [
    {
      title: 'Roles & Permissions',
      description: 'Learn about staff roles, granular permissions, and how to assign them properly',
      icon: AcademicCapIcon,
      href: '/help/roles-permissions',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'CEO/Secretary Setup',
      description: 'Complete guide for setting up CEO roles and department-scoped secretaries',
      icon: UserGroupIcon,
      href: '/help/ceo-secretary-setup',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      title: 'Visitor Auto-Routing',
      description: 'Understand how the intelligent visitor routing system works',
      icon: ShieldCheckIcon,
      href: '/help/auto-routing',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
    },
    {
      title: 'Department Management',
      description: 'Best practices for organizing departments and assigning managers',
      icon: BuildingOfficeIcon,
      href: '/help/departments',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    },
  ];

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-4xl">
        <Heading>Help & Documentation</Heading>
        <Text className="mt-2">
          Comprehensive guides and best practices for managing your organization
        </Text>

        <Divider className="my-8" />

        <div className="space-y-4">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Getting Started Guides
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <button
                key={guide.href}
                onClick={() => router.push(guide.href)}
                className="flex items-start gap-4 p-6 text-left rounded-lg border border-zinc-950/10 dark:border-white/10 hover:border-zinc-950/20 dark:hover:border-white/20 transition-colors bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md"
              >
                <div className={`flex-shrink-0 p-3 rounded-lg ${guide.bgColor}`}>
                  <guide.icon className={`size-6 ${guide.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    {guide.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {guide.description}
                  </p>
                  <div className="mt-3 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                    Read guide
                    <ArrowRightIcon className="ml-1 size-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Divider className="my-10" />

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <BookOpenIcon className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Quick Tip: Start with Roles & Permissions
              </h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Understanding the role-based access control system is essential for setting up your organization correctly.
                Start with the Roles & Permissions guide to learn the fundamentals.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Need More Help?
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            If you can't find what you're looking for in these guides, you can:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Contact support via the support page
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Check the system logs for error messages
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Review the database schema documentation
            </li>
          </ul>
        </div>
      </div>
    </ApplicationLayout>
  );
}
