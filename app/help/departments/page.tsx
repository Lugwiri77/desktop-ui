'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Divider } from '@/app/components/divider';
import { Button } from '@/app/components/button';
import { isAuthenticated, loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, BuildingOfficeIcon } from '@heroicons/react/20/solid';

export default function DepartmentManagementGuidePage() {
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

        <Heading>Department Management Guide</Heading>
        <Text className="mt-2">
          Best practices for organizing departments and assigning managers
        </Text>

        <Divider className="my-8" />

        {/* Default Departments */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Default Departments
          </h2>
          <Text>
            Every new organization is automatically created with four essential departments:
          </Text>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="size-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-950 dark:text-blue-100">Administration</h3>
                  <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">
                    Executive office, CEO, administrative support staff, and executive assistants.
                    This is the primary department for leadership and organizational management.
                  </p>
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-medium">
                    ✨ RECOMMENDED: Assign CEO and secretary to this department
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="size-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-950 dark:text-green-100">Maintenance</h3>
                  <p className="mt-1 text-sm text-green-900 dark:text-green-200">
                    Equipment maintenance, facility management, repairs, and upkeep services.
                    Handles all physical infrastructure and maintenance operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="size-6 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-950 dark:text-orange-100">Customer Management</h3>
                  <p className="mt-1 text-sm text-orange-900 dark:text-orange-200">
                    Customer relationships, support, satisfaction, and client services.
                    Primary point of contact for customer-facing operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="size-6 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-950 dark:text-purple-100">Security</h3>
                  <p className="mt-1 text-sm text-purple-900 dark:text-purple-200">
                    Security operations, access control, incident response, and safety management.
                    Handles visitor management, gate operations, and security monitoring.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Note:</strong> These default departments cannot be deleted as they are essential
              for core system operations. You can add additional departments as needed.
            </p>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Creating New Departments */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Creating Additional Departments
          </h2>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
              Step-by-Step Instructions
            </h3>
            <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Navigate to <strong>Departments</strong> in the sidebar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Click <strong>"Create New Department"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>Enter a clear, descriptive name (e.g., "Human Resources", "Finance", "IT Support")</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">4.</span>
                <span>Add a description explaining the department's purpose and responsibilities</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">5.</span>
                <span>Optionally assign a Department Manager</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">6.</span>
                <span>Click <strong>"Create Department"</strong></span>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Common Additional Departments:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Human Resources (HR)</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Finance & Accounting</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Information Technology (IT)</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Marketing & Communications</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Sales & Business Development</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Procurement & Logistics</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Legal & Compliance</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Research & Development</span>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Assigning Department Managers */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Assigning Department Managers
          </h2>
          <Text>
            Department Managers have scoped access to manage their specific department:
          </Text>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
              How to Assign a Department Manager
            </h3>
            <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Go to <strong>Staff Management</strong> → Select staff member</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Click <strong>"Manage Staff Role & Permissions"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>Set <strong>Staff Role</strong> to "Department Manager"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">4.</span>
                <span>Select the <strong>Department</strong> they will manage</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">5.</span>
                <span>Assign any additional granular permissions as needed</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">6.</span>
                <span>Click <strong>"Save Changes"</strong></span>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Department Manager Capabilities:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>View department-specific dashboard</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Manage visitors assigned to their department</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>View department staff (read-only)</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <CheckCircleIcon className="size-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Generate department-specific reports</span>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Best Practices */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Best Practices
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                1. Use Clear, Consistent Naming
              </h3>
              <Text className="text-sm">
                Use full department names rather than abbreviations (e.g., "Human Resources" not "HR Dept").
                This improves visitor understanding and auto-routing accuracy.
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                2. Assign Department Managers Strategically
              </h3>
              <Text className="text-sm">
                Assign managers who will actively use the system. They should be responsible for handling
                visitor routing and department-level decisions.
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                3. Keep Department Descriptions Updated
              </h3>
              <Text className="text-sm">
                Clear descriptions help staff understand department responsibilities and improve
                the accuracy of manual visitor routing.
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                4. Don't Over-Fragment Departments
              </h3>
              <Text className="text-sm">
                Avoid creating too many small departments. Group related functions together
                (e.g., "Finance & Accounting" rather than separate "Finance" and "Accounting" departments).
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                5. Regularly Review Department Structure
              </h3>
              <Text className="text-sm">
                As your organization grows, periodically review and reorganize departments to reflect
                current organizational structure.
              </Text>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Special Cases */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Special Department Configurations
          </h2>

          <div className="space-y-4">
            {/* Administration Department */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-950 dark:text-purple-100 mb-2">
                Administration Department (Executive Office)
              </h3>
              <div className="space-y-2 text-sm text-purple-900 dark:text-purple-200">
                <p><strong>Recommended Staff Assignments:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• CEO (Staff Role: "CEO")</li>
                  <li>• Executive Secretary (with "Is Secretary" permission enabled)</li>
                  <li>• Executive Assistants (with "Is Executive Assistant" permission enabled)</li>
                  <li>• Personal Assistants (with "Is Personal Assistant" permission enabled)</li>
                  <li>• Administrative support staff</li>
                </ul>
                <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <p className="font-medium">Why This Matters:</p>
                  <p className="mt-1">VIP visitors requesting CEO meetings will automatically route to secretaries
                  assigned to the Administration department. This ensures proper visitor handling at the executive level.</p>
                </div>
              </div>
            </div>

            {/* Security Department */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
                Security Department
              </h3>
              <div className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
                <p><strong>Special Features:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Department Managers see specialized security dashboard</li>
                  <li>• Includes internal/external staff tracking</li>
                  <li>• Gate management capabilities</li>
                  <li>• Incident reporting and management</li>
                </ul>
                <p className="mt-2">
                  <strong>Recommended Assignment:</strong> Assign your Head of Security or Security Manager
                  as the Department Manager for enhanced security oversight.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Important Notes */}
        <section className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex">
              <ExclamationTriangleIcon className="size-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-950 dark:text-amber-100">
                  Important Considerations
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-200">
                  <li>• Default departments (Administration, Maintenance, Customer Management, Security) cannot be deleted</li>
                  <li>• Deleting a department requires reassigning all staff members first</li>
                  <li>• Department changes affect visitor auto-routing immediately</li>
                  <li>• Department structure should align with your organizational chart</li>
                  <li>• Each department can have multiple managers if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        <div className="flex gap-4">
          <Button onClick={() => router.push('/help')} outline>
            Back to Help
          </Button>
          <Button onClick={() => router.push('/departments')}>
            Go to Department Management
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
