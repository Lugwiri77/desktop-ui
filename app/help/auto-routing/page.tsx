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

export default function VisitorAutoRoutingGuidePage() {
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

        <Heading>Visitor Auto-Routing Guide</Heading>
        <Text className="mt-2">
          Understanding the intelligent visitor routing system and how it works
        </Text>

        <Divider className="my-8" />

        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            What is Auto-Routing?
          </h2>
          <Text>
            Auto-routing is an intelligent system that automatically directs visitors to the appropriate
            department or staff member based on their purpose of visit. This reduces manual intervention
            and improves visitor experience.
          </Text>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
              How It Works
            </h3>
            <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
              <li>1. Visitor arrives at gate and security scans their QR code</li>
              <li>2. System sends OTP to visitor's phone for verification</li>
              <li>3. After successful OTP verification, auto-routing activates</li>
              <li>4. System analyzes visitor's purpose of visit</li>
              <li>5. Visitor is automatically routed to appropriate department/staff</li>
              <li>6. Assigned staff receives notification of visitor assignment</li>
            </ol>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Routing Priorities */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Auto-Routing Priorities
          </h2>
          <Text>
            The system uses a three-tier priority system to determine routing:
          </Text>

          <div className="space-y-4">
            {/* Priority 1: VIP/CEO */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-purple-950 dark:text-purple-100">
                  Priority 1: VIP/CEO Routing (Highest Priority)
                </h3>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                  DEPARTMENT-SCOPED
                </span>
              </div>

              <div className="space-y-2 text-sm text-purple-900 dark:text-purple-200">
                <p className="font-medium">Triggered when purpose contains:</p>
                <ul className="ml-4 space-y-1">
                  <li>• "ceo" or "chief executive"</li>
                  <li>• "managing director" or "md"</li>
                  <li>• "executive"</li>
                </ul>

                <p className="mt-3 font-medium">Routing Flow:</p>
                <ol className="ml-4 space-y-1">
                  <li>1. Find CEO's department (usually Administration)</li>
                  <li>2. Search for secretary/assistant IN CEO's department</li>
                  <li>3. If found: Route to secretary in that department</li>
                  <li>4. If not found: Route to CEO's department (no specific staff)</li>
                </ol>

                <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <p className="font-medium">Why Department-Scoped?</p>
                  <p className="mt-1">Large organizations may have multiple secretaries across different departments.
                  Department-scoped routing ensures CEO visitors go to the Administration secretary, not the Finance
                  secretary or HR secretary.</p>
                </div>
              </div>
            </div>

            {/* Priority 2: Staff-Specific */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-950 dark:text-blue-100 mb-2">
                Priority 2: Staff-Specific Routing
              </h3>

              <div className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium">Triggered when:</p>
                <ul className="ml-4 space-y-1">
                  <li>• Visitor pre-selects a specific staff member during registration</li>
                  <li>• Staff member is marked in visitor's "host" field</li>
                </ul>

                <p className="mt-3 font-medium">Routing Flow:</p>
                <ol className="ml-4 space-y-1">
                  <li>1. System checks if visitor has a designated host</li>
                  <li>2. Route directly to that staff member's department</li>
                  <li>3. Assign visitor to the specific staff member</li>
                </ol>
              </div>
            </div>

            {/* Priority 3: Keyword */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-950 dark:text-green-100 mb-2">
                Priority 3: Keyword-Based Routing
              </h3>

              <div className="space-y-2 text-sm text-green-900 dark:text-green-200">
                <p className="font-medium">Triggered when:</p>
                <ul className="ml-4 space-y-1">
                  <li>• Priority 1 and 2 don't match</li>
                  <li>• System analyzes purpose text for department keywords</li>
                </ul>

                <p className="mt-3 font-medium">Common Keywords:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="font-semibold">HR Department:</p>
                    <ul className="ml-4 text-xs">
                      <li>• recruitment, hiring, interview</li>
                      <li>• employee, staff, hr</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Finance:</p>
                    <ul className="ml-4 text-xs">
                      <li>• payment, invoice, billing</li>
                      <li>• finance, accounting</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">IT Department:</p>
                    <ul className="ml-4 text-xs">
                      <li>• technical support, it</li>
                      <li>• computer, network, system</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Procurement:</p>
                    <ul className="ml-4 text-xs">
                      <li>• delivery, supplier, vendor</li>
                      <li>• procurement, purchase</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Real-World Examples
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    "Meeting with CEO"
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    <strong>Priority 1 VIP Routing:</strong> Routes to Administration Department → Secretary
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    "Interview with John Doe (HR Manager)"
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    <strong>Priority 2 Staff-Specific:</strong> Routes directly to John Doe in HR Department
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    "Delivery for procurement department"
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    <strong>Priority 3 Keyword Routing:</strong> Matches "delivery" and "procurement" → Routes to Procurement Department
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    "Technical support needed"
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    <strong>Priority 3 Keyword Routing:</strong> Matches "technical support" → Routes to IT Department
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        {/* Fallback Handling */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Fallback Handling
          </h2>
          <Text>
            If auto-routing cannot determine an appropriate destination:
          </Text>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex">
              <ExclamationTriangleIcon className="size-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-950 dark:text-amber-100">
                  Manual Routing Required
                </h3>
                <div className="mt-2 space-y-2 text-sm text-amber-900 dark:text-amber-200">
                  <p>When all three priorities fail to match:</p>
                  <ul className="ml-4 space-y-1">
                    <li>• Visitor status remains as <code className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded">pending_routing</code></li>
                    <li>• Reception staff receives notification</li>
                    <li>• Staff can manually assign visitor to appropriate department</li>
                    <li>• Visitor waits in reception area until routing is complete</li>
                  </ul>
                </div>
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
                1. Configure CEO/Secretary Roles Properly
              </h3>
              <Text className="text-sm">
                Ensure CEO and secretary are assigned to the same department (usually Administration)
                for VIP routing to work correctly. See the CEO/Secretary Setup guide for details.
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                2. Use Clear Purpose Descriptions
              </h3>
              <Text className="text-sm">
                Encourage visitors to use clear, keyword-rich purpose descriptions during registration
                (e.g., "Interview with HR" instead of just "Meeting").
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                3. Keep Department Keywords Updated
              </h3>
              <Text className="text-sm">
                Regularly review and update department keyword mappings to improve routing accuracy
                as your organization evolves.
              </Text>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-950 dark:text-white mb-2">
                4. Monitor Manual Routing Cases
              </h3>
              <Text className="text-sm">
                Track visitors that require manual routing to identify patterns and improve
                your keyword configuration.
              </Text>
            </div>
          </div>
        </section>

        <Divider className="my-10" />

        <div className="flex gap-4">
          <Button onClick={() => router.push('/help')} outline>
            Back to Help
          </Button>
          <Button onClick={() => router.push('/help/departments')}>
            Next: Department Management →
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
