'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Link } from '../components/link';
import {
  getMyGroups,
  type Group,
  GroupType,
  GroupStatus,
} from '@/lib/groups-api';

// Statistics calculated from groups
interface GroupStatistics {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  totalBalance: number;
}

import {
  UserGroupIcon,
  BanknotesIcon,
  UsersIcon,
  CheckCircleIcon,
  PlusIcon,
  HeartIcon,
  HandRaisedIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency } from '@/lib/formatting-utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level={2} className="text-3xl font-semibold">
              {value}
            </Heading>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          {subtitle && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</Text>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function getGroupTypeBadge(groupType: GroupType) {
  const colorMap: Record<GroupType, 'blue' | 'green' | 'purple' | 'yellow'> = {
    [GroupType.SavingsGroup]: 'blue',
    [GroupType.Chama]: 'green',
    [GroupType.Fundraising]: 'purple',
    [GroupType.InvestmentClub]: 'yellow',
  };
  const labelMap: Record<GroupType, string> = {
    [GroupType.SavingsGroup]: 'Savings Group',
    [GroupType.Chama]: 'Chama',
    [GroupType.Fundraising]: 'Fundraising',
    [GroupType.InvestmentClub]: 'Investment Club',
  };
  return <Badge color={colorMap[groupType]}>{labelMap[groupType]}</Badge>;
}

function getGroupStatusBadge(status: GroupStatus) {
  const colorMap: Record<GroupStatus, 'green' | 'yellow' | 'red' | 'zinc'> = {
    [GroupStatus.Active]: 'green',
    [GroupStatus.Inactive]: 'yellow',
    [GroupStatus.Suspended]: 'red',
    [GroupStatus.Closed]: 'zinc',
  };
  const labelMap: Record<GroupStatus, string> = {
    [GroupStatus.Active]: 'Active',
    [GroupStatus.Inactive]: 'Inactive',
    [GroupStatus.Suspended]: 'Suspended',
    [GroupStatus.Closed]: 'Closed',
  };
  return <Badge color={colorMap[status]}>{labelMap[status]}</Badge>;
}

export default function GroupsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

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

    // Check if user is administrator or IT staff
    if (!isAdministrator(info.userRole) && info.userRole !== 'ITAdministrator') {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  // Load groups and statistics
  useEffect(() => {
    const loadGroups = async () => {
      if (!userInfo) return;

      setLoadingGroups(true);
      setLoadingStats(true);
      try {
        const groups = await getMyGroups();
        setMyGroups(groups);

        // Calculate statistics
        const stats: GroupStatistics = {
          totalGroups: groups.length,
          activeGroups: groups.filter(g => g.status === GroupStatus.Active).length,
          totalMembers: groups.reduce((sum, g) => sum + g.currentMemberCount, 0),
          totalBalance: groups.reduce((sum, g) => sum + parseFloat(g.currentBalance), 0),
        };

        setStatistics(stats);
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        setLoadingGroups(false);
        setLoadingStats(false);
      }
    };

    loadGroups();
  }, [userInfo]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Groups & Chamas</Heading>
          <Text>Manage your savings groups, chamas, and investment clubs</Text>
        </div>
        <div className="flex gap-2">
          <Button href="/groups/create" color="blue">
            <PlusIcon className="h-5 w-5" />
            Create Group
          </Button>
          <Button href="/campaigns" outline>
            <HeartIcon className="h-5 w-5" />
            Campaigns
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </>
        ) : statistics ? (
          <>
            <StatCard
              title="Total Groups"
              value={statistics.totalGroups.toString()}
              subtitle={`${statistics.activeGroups} active`}
              icon={UserGroupIcon}
              color="blue"
            />
            <StatCard
              title="Total Members"
              value={statistics.totalMembers.toString()}
              subtitle="Across all groups"
              icon={UsersIcon}
              color="green"
            />
            <StatCard
              title="Total Balance"
              value={formatCurrency(statistics.totalBalance.toString(), 'KES')}
              subtitle="Combined group funds"
              icon={BanknotesIcon}
              color="yellow"
            />
            <StatCard
              title="Active Groups"
              value={statistics.activeGroups.toString()}
              subtitle={`${Math.round((statistics.activeGroups / Math.max(statistics.totalGroups, 1)) * 100)}% of total`}
              icon={CheckCircleIcon}
              color="green"
              trend="up"
            />
          </>
        ) : (
          <div className="col-span-4">
            <Text className="text-center text-zinc-500">No group statistics available</Text>
          </div>
        )}
      </div>

      {/* My Groups List */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Heading level={3}>My Groups</Heading>
          <Link href="/groups/discover">Discover more groups →</Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loadingGroups ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          ) : myGroups.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {myGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/groups/${group.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {group.name}
                      </Link>
                      {group.description && (
                        <Text className="text-xs text-zinc-500">{group.description}</Text>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getGroupTypeBadge(group.groupType)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text>
                        {group.currentMemberCount}
                        {group.maxMembers && ` / ${group.maxMembers}`}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-medium">
                        {formatCurrency(group.currentBalance, 'KES')}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getGroupStatusBadge(group.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">
                No groups yet
              </Heading>
              <Text className="mt-2 text-zinc-500">
                Create your first group or join an existing one to get started
              </Text>
              <div className="mt-4 flex justify-center gap-4">
                <Button href="/groups/create" color="blue">
                  Create Group
                </Button>
                <Button href="/groups/discover" outline>
                  Discover Groups
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Heading level={3}>Quick Actions</Heading>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button href="/groups/create" outline className="justify-start">
            <PlusIcon className="h-5 w-5" />
            <span className="ml-2">Create New Group</span>
          </Button>
          <Button href="/groups/discover" outline className="justify-start">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="ml-2">Discover Groups</span>
          </Button>
          <Button href="/campaigns" outline className="justify-start">
            <HeartIcon className="h-5 w-5" />
            <span className="ml-2">View Campaigns</span>
          </Button>
          <Button href="/campaigns/create" outline className="justify-start">
            <HandRaisedIcon className="h-5 w-5" />
            <span className="ml-2">Create Campaign</span>
          </Button>
        </div>
      </div>
    </ApplicationLayout>
  );
}
