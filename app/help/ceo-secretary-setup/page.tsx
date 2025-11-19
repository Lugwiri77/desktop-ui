'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Divider } from '@/app/components/divider';
import { Button } from '@/app/components/button';
import { isAuthenticated, loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import { ArrowLeftIcon, CheckCircleIcon, InformationCircleIcon, LightBulbIcon } from '@heroicons/react/20/solid';

export default function CEOSecretarySetupGuidePage() {
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

        <Heading>CEO/Secretary Setup Guide</Heading>
        <Text className="mt-2">
          Complete guide for setting up CEO roles and department-scoped secretaries
        </Text>

        <Divider className="my-8" />

        {/* Why Department-Scoped */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Why Department-Scoped Secretaries?
          </h2>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex">
              <LightBulbIcon className="size-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-950 dark:text-blue-100">
                  Best Practice: Department-Scoped Routing
                </h3>
                <p className="mt-2 text-sm text-blue-900 dark:text-blue-200">
                  In large organizations, multiple departments may have secretaries (CEO's secretary in Administration,
                  Finance Manager's secretary in Finance, etc.). Department-scoped routing ensures:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-900 dark:text-blue-200">
                  <li>✅ <strong>Scalable</strong> - Multiple secretaries can coexist without conflicts</li>
                  <li>✅ <strong>Efficient</strong> - Visitors route to the correct secretary for their department</li>
                  <li>✅ <strong>Predictable</strong> - Clear organizational structure that matches reality</li>
                  <li>✅ <strong>Accurate</strong> - CEO visitors → CEO's secretary (not another department's secretary)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Administration Department */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Step 1: Verify Administration Department
          </h2>
          <Text>
            Good news! The <strong>Administration</strong> department is automatically created for all organizations.
          </Text>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex">
              <CheckCircleIcon className="size-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-950 dark:text-green-100">
                  Default Departments
                </h3>
                <p className="mt-2 text-sm text-green-900 dark:text-green-200">
                  Every organization automatically gets 4 default departments:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-green-900 dark:text-green-200">
                  <li>• <strong>Administration</strong> - Executive office, CEO, and administrative support staff</li>
                  <li>• <strong>Maintenance</strong> - Equipment maintenance, facility management, and repairs</li>
                  <li>• <strong>Customer Management</strong> - Customer relationships, support, and satisfaction</li>
                  <li>• <strong>Security</strong> - Security operations, access control, and incident response</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            To verify: Navigate to <strong>Departments</strong> in the sidebar. You should see "Administration" listed as a default department.
          </div>
        </section>

        <Divider className="my-10" />

        {/* Assign CEO */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Step 2: Assign CEO Role
          </h2>
          <Text>
            Assign the CEO role to your Chief Executive Officer.
          </Text>

          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-950 dark:text-white mb-3">
              Step-by-Step Instructions
            </h3>
            <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">1.</span>
                <span>Navigate to <strong>Staff Management</strong> in the sidebar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">2.</span>
                <span>Find and select the staff member who will be CEO</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">3.</span>
                <span>Click <strong>"Manage Staff Role & Permissions"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">4.</span>
                <div>
                  <div><strong>Staff Role:</strong> Select <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">"CEO"</span></div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">5.</span>
                <div>
                  <div><strong>Department:</strong> Select <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">"Administration"</span></div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">6.</span>
                <span>Click <strong>"Save Changes"</strong></span>
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="flex">
              <InformationCircleIcon className="size-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-950 dark:text-purple-100">
                  What This Does
                </h3>
                <p className="mt-2 text-sm text-purple-900 dark:text-purple-200">
                  The CEO role grants full administrator access to the system. Additionally:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-purple-900 dark:text-purple-200">
                  <li>• CEO can manage all organization settings</li>
                  <li>• CEO can update/delete locations (like administrators)</li>
                  <li>• Visitors requesting "CEO" will be auto-routed to the CEO's department</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Assign Secretary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Step 3: Assign Secretary Role
          </h2>
          <Text>
            Assign the secretary role to the person who assists the CEO.
          </Text>

          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-950 dark:text-white mb-3">
              Step-by-Step Instructions
            </h3>
            <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">1.</span>
                <span>Navigate to <strong>Staff Management</strong> in the sidebar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">2.</span>
                <span>Find and select the staff member who will be the CEO's secretary</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">3.</span>
                <span>Click <strong>"Manage Staff Role & Permissions"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">4.</span>
                <div>
                  <div><strong>Staff Role:</strong> Select <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">"Staff"</span> or <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">"Department Manager"</span></div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">5.</span>
                <div>
                  <div><strong>Department:</strong> Select <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">"Administration"</span></div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">⚠️ IMPORTANT: Must be the same department as the CEO!</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">6.</span>
                <span>Scroll down to the <strong>"Executive/VIP Roles"</strong> section</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">7.</span>
                <div>
                  <div>Check one of the following:</div>
                  <ul className="mt-1 space-y-1 ml-4">
                    <li>☑️ <strong>Is Secretary</strong></li>
                    <li>☑️ <strong>Is Executive Assistant</strong></li>
                    <li>☑️ <strong>Is Personal Assistant</strong></li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-100">8.</span>
                <span>Click <strong>"Save Changes"</strong></span>
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex">
              <CheckCircleIcon className="size-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-950 dark:text-green-100">
                  What This Enables
                </h3>
                <p className="mt-2 text-sm text-green-900 dark:text-green-200">
                  When a visitor arrives with purpose "Meeting with CEO":
                </p>
                <ol className="mt-2 space-y-1 text-sm text-green-900 dark:text-green-200">
                  <li>1. System finds CEO's department (Administration)</li>
                  <li>2. System searches for secretary <strong>IN Administration department</strong></li>
                  <li>3. Visitor is auto-routed to Administration department</li>
                  <li>4. Visitor is assigned to the secretary (specific staff member)</li>
                  <li>5. Secretary receives notification of visitor assignment</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Fallback Scenarios */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Fallback Scenarios
          </h2>
          <Text>
            The system has intelligent fallback logic to handle edge cases:
          </Text>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">
                Scenario 1: Secretary Exists in CEO's Department
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                ✅ <strong>Best case:</strong> Visitor routes directly to secretary in Administration department
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">
                Scenario 2: No Secretary in CEO's Department
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                ⚠️ <strong>Fallback:</strong> Visitor routes to Administration department (no specific staff assigned)
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white">
                Scenario 3: CEO Has No Department Assigned
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                ❌ <strong>No auto-routing:</strong> Visitor stays in "pending_routing" status for manual routing
              </p>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Multiple Departments */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Advanced: Multiple Department Secretaries
          </h2>
          <Text>
            In large organizations, you can have secretaries in multiple departments:
          </Text>

          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-950 dark:text-white mb-3">
              Example Structure
            </h3>
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-start">
                <span className="mr-2">📁</span>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">Administration Department</div>
                  <div className="ml-4 mt-1">
                    <div>👤 CEO (Staff Role: "CEO")</div>
                    <div>👤 CEO's Secretary (Granular Permission: "Is Secretary")</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <span className="mr-2">📁</span>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">Finance Department</div>
                  <div className="ml-4 mt-1">
                    <div>👤 Finance Manager (Staff Role: "Department Manager")</div>
                    <div>👤 Finance Secretary (Granular Permission: "Is Secretary")</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <span className="mr-2">📁</span>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">HR Department</div>
                  <div className="ml-4 mt-1">
                    <div>👤 HR Manager (Staff Role: "Department Manager")</div>
                    <div>👤 HR Secretary (Granular Permission: "Is Secretary")</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex">
              <InformationCircleIcon className="size-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Auto-routing is intelligent:</strong> Visitors requesting "CEO" route to Administration's secretary.
                Visitors requesting "Finance Manager" can route to Finance's secretary (if implemented with similar logic).
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        <div className="flex gap-4">
          <Button onClick={() => router.push('/help')} outline>
            Back to Help
          </Button>
          <Button onClick={() => router.push('/staff')}>
            Go to Staff Management
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
