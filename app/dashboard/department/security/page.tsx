'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, UserCheck, MapPin, Eye, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Badge } from '@/app/components/badge';
import { Button } from '@/app/components/button';
import { Divider } from '@/app/components/divider';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import Link from 'next/link';

export default function SecurityDepartmentDashboardPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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

    // Check if user has access to Security Department
    if (info.staffRole !== 'DepartmentManager' || info.department !== 'Security') {
      router.push('/dashboard');
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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-zinc-900 font-medium">Security Department</span>
        </nav>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <Heading>Security Department Dashboard</Heading>
          </div>
          <Text className="mt-2">
            Manage internal staff, external contractors, gates, and security operations
          </Text>
        </div>

        <Divider />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Internal Staff"
            value="--"
            description="Active security staff"
          />
          <StatsCard
            icon={<UserCheck className="h-6 w-6 text-green-600" />}
            title="External Staff"
            value="--"
            description="Active contractors"
          />
          <StatsCard
            icon={<MapPin className="h-6 w-6 text-purple-600" />}
            title="Gates"
            value="--"
            description="Monitored locations"
          />
          <StatsCard
            icon={<Eye className="h-6 w-6 text-orange-600" />}
            title="Visitors Today"
            value="--"
            description="Active visits"
          />
        </div>

        {/* Analytics Section */}
        <div>
          <Heading level={2}>Department Analytics</Heading>
          <Text className="mt-1 mb-4">Real-time insights and trends</Text>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Distribution Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
              <h3 className="text-base font-semibold text-zinc-900 mb-4">Staff Distribution</h3>
              <StaffDistributionChart />
            </div>

            {/* Visitor Trends Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
              <h3 className="text-base font-semibold text-zinc-900 mb-4">Visitor Trends (7 Days)</h3>
              <VisitorTrendsChart />
            </div>

            {/* Incident Trends Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
              <h3 className="text-base font-semibold text-zinc-900 mb-4">Incidents This Month</h3>
              <IncidentTrendsChart />
            </div>

            {/* Gate Coverage Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
              <h3 className="text-base font-semibold text-zinc-900 mb-4">Gate Coverage Status</h3>
              <GateCoverageChart />
            </div>
          </div>
        </div>

        {/* Placeholder for backend integration */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                <strong>Backend integration in progress.</strong> Charts will display real-time data once connected to the backend API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}

// Chart Components
function StaffDistributionChart() {
  // Sample data - will be replaced with real API data
  const data = [
    { name: 'Internal Staff', value: 12, fill: '#3b82f6' },
    { name: 'External Staff', value: 8, fill: '#10b981' },
  ];

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-blue-100">
          <Users className="h-16 w-16 text-blue-600" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-sm text-zinc-600">Internal: 12</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-sm text-zinc-600">External: 8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitorTrendsChart() {
  // Sample data - will be replaced with real API data
  const data = [
    { day: 'Mon', visitors: 45 },
    { day: 'Tue', visitors: 52 },
    { day: 'Wed', visitors: 38 },
    { day: 'Thu', visitors: 61 },
    { day: 'Fri', visitors: 55 },
    { day: 'Sat', visitors: 32 },
    { day: 'Sun', visitors: 28 },
  ];

  return (
    <div className="h-64 w-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-end justify-between gap-2 px-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                style={{ height: `${(item.visitors / 70) * 100}%`, minHeight: '20px' }}
              ></div>
              <span className="text-xs text-zinc-600">{item.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-sm text-zinc-500">
          Average: 44 visitors/day
        </div>
      </div>
    </div>
  );
}

function IncidentTrendsChart() {
  const data = [
    { type: 'Minor', count: 3, color: 'bg-yellow-500' },
    { type: 'Medium', count: 1, color: 'bg-orange-500' },
    { type: 'Critical', count: 0, color: 'bg-red-500' },
  ];

  return (
    <div className="h-64 w-full flex flex-col justify-center space-y-4">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">{item.type}</span>
            <span className="text-sm text-zinc-600">{item.count}</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-3">
            <div
              className={`${item.color} h-3 rounded-full transition-all`}
              style={{ width: `${item.count > 0 ? (item.count / 5) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-700 text-center">
          <strong>4 incidents</strong> resolved this month
        </p>
      </div>
    </div>
  );
}

function GateCoverageChart() {
  const gates = [
    { name: 'Main Entrance', coverage: 100, staff: 2 },
    { name: 'Back Gate', coverage: 50, staff: 1 },
    { name: 'Parking', coverage: 0, staff: 0 },
    { name: 'Loading Bay', coverage: 100, staff: 1 },
  ];

  return (
    <div className="h-64 w-full flex flex-col justify-center space-y-3">
      {gates.map((gate, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">{gate.name}</span>
            <span className="text-xs text-zinc-500">{gate.staff} staff</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                gate.coverage === 100
                  ? 'bg-green-500'
                  : gate.coverage > 0
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${gate.coverage}%` }}
            ></div>
          </div>
        </div>
      ))}
      <div className="mt-2 text-center text-sm text-zinc-600">
        Overall Coverage: <strong className="text-zinc-900">75%</strong>
      </div>
    </div>
  );
}

// Helper Components
interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

function StatsCard({ icon, title, value, description }: StatsCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
      <div className="flex items-center justify-between mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
      <div className="text-sm font-medium text-zinc-700">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{description}</div>
    </div>
  );
}

