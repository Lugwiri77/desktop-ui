'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { Link } from '../../components/link';
import {
  listGroups,
  searchGroups,
  type Group,
  GroupType,
  GroupStatus,
} from '@/lib/groups-api';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  UsersIcon,
  BanknotesIcon,
  MapPinIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency } from '@/lib/formatting-utils';

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
  return <Badge color={colorMap[status]}>{status}</Badge>;
}

interface GroupCardProps {
  group: Group;
}

function GroupCard({ group }: GroupCardProps) {
  const memberPercentage = group.maxMembers
    ? (group.currentMemberCount / group.maxMembers) * 100
    : 0;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Heading level={4} className="line-clamp-1">{group.name}</Heading>
          {group.location && (
            <Text className="mt-1 flex items-center text-xs text-zinc-500">
              <MapPinIcon className="mr-1 h-3 w-3" />
              {group.location}
            </Text>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {getGroupTypeBadge(group.groupType)}
          {getGroupStatusBadge(group.status)}
        </div>
      </div>

      {group.description && (
        <Text className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {group.description}
        </Text>
      )}

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center text-zinc-500 dark:text-zinc-400">
            <UsersIcon className="mr-1 h-4 w-4" />
            <Text className="text-xs">Members</Text>
          </div>
          <Text className="mt-1 font-semibold">
            {group.currentMemberCount}
            {group.maxMembers && ` / ${group.maxMembers}`}
          </Text>
          {group.maxMembers && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(memberPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center text-zinc-500 dark:text-zinc-400">
            <BanknotesIcon className="mr-1 h-4 w-4" />
            <Text className="text-xs">Balance</Text>
          </div>
          <Text className="mt-1 font-semibold">
            {formatCurrency(group.currentBalance, 'KES')}
          </Text>
        </div>
      </div>

      {/* Contribution Info */}
      {group.contributionAmount && (
        <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            Contribution: {formatCurrency(group.contributionAmount, 'KES')}
            {group.contributionFrequency && ` (${group.contributionFrequency})`}
          </Text>
        </div>
      )}

      {/* Meeting Schedule */}
      {group.meetingSchedule && (
        <Text className="mt-3 text-xs text-zinc-500">
          Meetings: {group.meetingSchedule}
        </Text>
      )}
    </Link>
  );
}

export default function DiscoverGroupsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType | 'all'>('all');

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

    setUserInfo(info);
  }, [router]);

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!userInfo) return;

      setLoading(true);
      try {
        if (searchTerm) {
          // Use search if there's a search term
          const results = await searchGroups(
            searchTerm,
            selectedType !== 'all' ? selectedType : undefined
          );
          setGroups(results);
        } else {
          // Otherwise list all public groups
          const allGroups = await listGroups({
            groupType: selectedType !== 'all' ? selectedType : undefined,
            limit: 50,
          });
          setGroups(allGroups);
        }
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(loadGroups, 300);
    return () => clearTimeout(timeoutId);
  }, [userInfo, searchTerm, selectedType]);

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
          <Heading>Discover Groups</Heading>
          <Text>Find and join public savings groups and chamas</Text>
        </div>
        <Button href="/groups/create" color="blue">
          Create Your Own Group
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mt-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search groups by name, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setSelectedType(GroupType.Chama)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedType === GroupType.Chama
                ? 'bg-green-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Chamas
          </button>
          <button
            onClick={() => setSelectedType(GroupType.SavingsGroup)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedType === GroupType.SavingsGroup
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Savings Groups
          </button>
          <button
            onClick={() => setSelectedType(GroupType.InvestmentClub)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedType === GroupType.InvestmentClub
                ? 'bg-yellow-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Investment Clubs
          </button>
          <button
            onClick={() => setSelectedType(GroupType.Fundraising)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedType === GroupType.Fundraising
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Fundraising
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            {loading ? 'Searching...' : `${groups.length} groups found`}
          </Text>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <UserGroupIcon className="mx-auto h-16 w-16 text-zinc-400" />
            <Heading level={3} className="mt-4">
              No groups found
            </Heading>
            <Text className="mt-2 text-zinc-500">
              {searchTerm
                ? 'Try adjusting your search terms or filters'
                : 'Be the first to create a group in this category'}
            </Text>
            <Button href="/groups/create" color="blue" className="mt-6">
              Create a Group
            </Button>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
