'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Divider } from '@/app/components/divider';
import { Button } from '@/app/components/button';
import { isAuthenticated, loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';

export default function RolesPermissionsGuidePage() {
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

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-4xl">
        <Button onClick={() => router.push('/help')} className="mb-4" outline>
          <ArrowLeftIcon className="mr-2" />
          Back to Documentation
        </Button>

        <Heading>Roles & Permissions Guide</Heading>
        <Text className="mt-2">
          Complete guide to the Role-Based Access Control (RBAC) system
        </Text>

        <Divider className="my-8" />

        {/* Staff Role Types */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Staff Role Types
          </h2>
          <Text>
            Every staff member must be assigned one of these primary roles. This determines their overall access level:
          </Text>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Administrator</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Full system access - Can manage all aspects of the organization
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-purple-950 dark:text-purple-100">CEO</h3>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                  NEW
                </span>
              </div>
              <p className="mt-1 text-sm text-purple-900 dark:text-purple-200">
                Chief Executive Officer - Executive leadership with full system access
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">HR Manager</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Human Resources - Manage staff, departments, and assign roles
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">IT Administrator</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                IT System Admin - Manage database config, integrations, and system settings
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Department Manager</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Department Manager - Scoped access to manage a specific department
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Staff</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Regular Employee - Basic access with limited permissions
              </p>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Granular Permissions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Granular Permissions
          </h2>
          <Text>
            In addition to the staff role, you can enable specific permissions for fine-grained access control:
          </Text>

          <div className="space-y-6">
            {/* Organization Management */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Organization & Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Update organization settings</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Manage database configuration</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>View organization info</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Update organization info</span>
                </div>
              </div>
            </div>

            {/* Staff Management */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Staff Management (HR)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Register new staff</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Update staff information</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Assign roles & permissions</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Deactivate staff accounts</span>
                </div>
              </div>
            </div>

            {/* Visitor Management */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Visitor Management
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Scan visitor QR codes</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Route visitors to departments</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>View assigned visitors</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                  <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Mark visitors as served</span>
                </div>
              </div>
            </div>

            {/* Executive/VIP Roles */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-purple-950 dark:text-purple-100">
                  Executive/VIP Roles (for CEO visitor auto-routing)
                </h3>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                  NEW
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-purple-900 dark:text-purple-200 flex items-start">
                  <CheckCircleIcon className="size-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Is Chief Executive Officer</strong> - CEO role, visitors requesting CEO are routed here</span>
                </div>
                <div className="text-sm text-purple-900 dark:text-purple-200 flex items-start">
                  <CheckCircleIcon className="size-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Is Secretary</strong> - VIP visitors are auto-routed to secretary first</span>
                </div>
                <div className="text-sm text-purple-900 dark:text-purple-200 flex items-start">
                  <CheckCircleIcon className="size-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Is Executive Assistant</strong> - VIP visitors are auto-routed to executive assistant</span>
                </div>
                <div className="text-sm text-purple-900 dark:text-purple-200 flex items-start">
                  <CheckCircleIcon className="size-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Is Personal Assistant</strong> - VIP visitors are auto-routed to personal assistant</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* How to Assign */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            How to Assign Roles & Permissions
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
                Step-by-Step Instructions
              </h3>
              <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">1.</span>
                  <span>Navigate to <strong>Staff Management</strong> in the sidebar</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">2.</span>
                  <span>Select a staff member from the list</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">3.</span>
                  <span>Click <strong>"Manage Staff Role & Permissions"</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">4.</span>
                  <span>Select the appropriate <strong>Staff Role</strong> from the dropdown</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">5.</span>
                  <span>If needed, select a <strong>Department</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">6.</span>
                  <span>Check any additional <strong>Granular Permissions</strong> needed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-semibold">7.</span>
                  <span>Click <strong>"Save Changes"</strong></span>
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex">
                <ExclamationTriangleIcon className="size-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-950 dark:text-amber-100">
                    Important Notes
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-200">
                    <li>• Permissions are cumulative - staff role + granular permissions</li>
                    <li>• Department assignment is required for Department Managers</li>
                    <li>• CEO and Secretary roles should be in the same department (Administration)</li>
                    <li>• Changes take effect immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        <div className="flex gap-4">
          <Button onClick={() => router.push('/help')} outline>
            Back to Help
          </Button>
          <Button onClick={() => router.push('/help/ceo-secretary-setup')}>
            Next: CEO/Secretary Setup →
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
