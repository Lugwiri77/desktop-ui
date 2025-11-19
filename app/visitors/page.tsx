'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { getStaffRBACRole, GranularPermissions } from '@/lib/graphql';
import { getActiveVisitors, getVisitorStats } from '@/lib/visitor-management';
import { isAuthenticated } from '@/lib/api';
import { loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import SecurityGate from './components/SecurityGate';
import CustomerCareRouting from './components/CustomerCareRouting';
import DepartmentService from './components/DepartmentService';
import VisitorDashboard from './components/VisitorDashboard';

export default function VisitorsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'routing' | 'service'>('dashboard');

  useEffect(() => {
    // Check authentication
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

  // Get current staff member's permissions
  const { data: rbacData } = useQuery({
    queryKey: ['staffRBACRole', userInfo?.id],
    queryFn: async () => {
      if (!userInfo?.id) throw new Error('No user ID found');
      return getStaffRBACRole(userInfo.id);
    },
    enabled: !!userInfo?.id,
  });

  const permissions = rbacData?.granularPermissions
    ? JSON.parse(rbacData.granularPermissions) as GranularPermissions
    : null;

  // Get active visitors
  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['activeVisitors'],
    queryFn: () => getActiveVisitors(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get visitor stats
  const { data: stats } = useQuery({
    queryKey: ['visitorStats'],
    queryFn: getVisitorStats,
    refetchInterval: 15000, // Faster polling for real-time updates
  });

  // Determine which tabs to show based on permissions
  const canAccessSecurity = permissions?.can_scan_visitor_entry || permissions?.can_scan_visitor_exit;
  const canAccessRouting = permissions?.can_route_visitors || permissions?.can_assign_visitor_destination;
  const canAccessService = permissions?.can_view_assigned_visitors || permissions?.can_mark_visitor_served;

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
      <div className="mx-auto max-w-7xl">
      <Heading>Visitor Management</Heading>
      <div className="mt-6 border-b border-zinc-950/10 dark:border-white/10">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Dashboard
          </button>

          {canAccessSecurity && (
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Security Gate
            </button>
          )}

          {canAccessRouting && (
            <button
              onClick={() => setActiveTab('routing')}
              className={`${
                activeTab === 'routing'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
              } relative whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Customer Care
              {stats && stats.pendingRouting > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                  {stats.pendingRouting}
                </span>
              )}
            </button>
          )}

          {canAccessService && (
            <button
              onClick={() => setActiveTab('service')}
              className={`${
                activeTab === 'service'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Department Service
            </button>
          )}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <VisitorDashboard
            activeVisitors={activeVisitors}
            stats={stats}
            permissions={permissions}
          />
        )}
        {activeTab === 'security' && canAccessSecurity && (
          <SecurityGate permissions={permissions} />
        )}
        {activeTab === 'routing' && canAccessRouting && (
          <CustomerCareRouting permissions={permissions} />
        )}
        {activeTab === 'service' && canAccessService && (
          <DepartmentService permissions={permissions} />
        )}
      </div>
    </div>
    </ApplicationLayout>
  );
}
