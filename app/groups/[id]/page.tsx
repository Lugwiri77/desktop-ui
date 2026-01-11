'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { Link } from '../../components/link';
import {
  getGroup,
  getGroupMembers,
  getGroupStats,
  inviteMember,
  updateMemberRole,
  approveMembership,
  type Group,
  type GroupMember,
  type GroupStats,
  type GroupMemberRole,
  GroupStatus,
  GroupType,
} from '@/lib/groups-api';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  BanknotesIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';

type TabType = 'overview' | 'members' | 'finances' | 'activity';

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

function getMemberRoleBadge(role: GroupMemberRole) {
  const colorMap: Record<GroupMemberRole, 'purple' | 'blue' | 'green' | 'yellow' | 'zinc'> = {
    admin: 'purple',
    chairperson: 'blue',
    treasurer: 'green',
    secretary: 'yellow',
    member: 'zinc',
  };
  const labelMap: Record<GroupMemberRole, string> = {
    admin: 'Admin',
    chairperson: 'Chairperson',
    treasurer: 'Treasurer',
    secretary: 'Secretary',
    member: 'Member',
  };
  return <Badge color={colorMap[role]}>{labelMap[role]}</Badge>;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
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
          <div className="mt-2">
            <Heading level={2} className="text-3xl font-semibold">
              {value}
            </Heading>
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

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStaffId, setInviteStaffId] = useState('');
  const [inviteRole, setInviteRole] = useState<GroupMemberRole>('member');
  const [inviting, setInviting] = useState(false);

  // Update role state
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!userInfo || !groupId) return;

      setLoading(true);
      setError(null);

      try {
        const [groupData, membersData, statsData] = await Promise.all([
          getGroup(groupId),
          getGroupMembers(groupId),
          getGroupStats(groupId),
        ]);

        setGroup(groupData);
        setMembers(membersData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group data');
        console.error('Failed to load group:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [userInfo, groupId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteStaffId || !group) return;

    setInviting(true);
    try {
      const result = await inviteMember({
        groupId: group.id,
        inviteeId: inviteStaffId,
        role: inviteRole,
      });

      if (result.success && result.member) {
        // Refresh members list
        const updatedMembers = await getGroupMembers(groupId);
        setMembers(updatedMembers);
        setShowInviteModal(false);
        setInviteStaffId('');
        setInviteRole('member');
      } else {
        alert(result.message || 'Failed to invite member');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: GroupMemberRole) => {
    if (!group) return;

    setUpdatingRole(memberId);
    try {
      const result = await updateMemberRole({
        groupId: group.id,
        memberId,
        newRole,
      });

      if (result.success) {
        // Refresh members list
        const updatedMembers = await getGroupMembers(groupId);
        setMembers(updatedMembers);
      } else {
        alert(result.message || 'Failed to update role');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleApproveMember = async (memberId: string, approve: boolean) => {
    if (!group) return;

    try {
      const result = await approveMembership({
        groupId: group.id,
        memberId,
        approve,
      });

      if (result.success) {
        // Refresh members list
        const updatedMembers = await getGroupMembers(groupId);
        setMembers(updatedMembers);
      } else {
        alert(result.message || 'Failed to process approval');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process approval');
    }
  };

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

  if (loading) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <Text className="mt-4">Loading group...</Text>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error || !group) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="mb-6">
          <Button href="/groups" outline>
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="ml-2">Back to Groups</span>
          </Button>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/50">
          <Heading level={3} className="text-red-800 dark:text-red-200">
            {error || 'Group not found'}
          </Heading>
          <Text className="mt-2 text-red-600 dark:text-red-400">
            The group you're looking for doesn't exist or you don't have permission to view it.
          </Text>
        </div>
      </ApplicationLayout>
    );
  }

  const pendingMembers = members.filter(m => m.approvalStatus === 'pending');
  const activeMembers = members.filter(m => m.approvalStatus === 'approved' && m.isActive);
  const isAdmin = activeMembers.some(m => m.role === 'admin'); // Check if current user is admin

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      {/* Header */}
      <div className="mb-6">
        <Button href="/groups" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Groups</span>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Heading>{group.name}</Heading>
            {getGroupTypeBadge(group.groupType)}
            {getGroupStatusBadge(group.status)}
          </div>
          {group.description && (
            <Text className="mt-2 max-w-3xl">{group.description}</Text>
          )}
        </div>
        <div className="flex gap-2">
          <Button href={`/groups/${group.id}/edit`} outline>
            <PencilIcon className="h-5 w-5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Members
            {pendingMembers.length > 0 && (
              <Badge color="red" className="ml-2">
                {pendingMembers.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'finances'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Finances
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Activity
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && stats && (
          <div>
            {/* Statistics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Balance"
                value={formatCurrency(group.currentBalance, 'KES')}
                subtitle="Group funds"
                icon={BanknotesIcon}
                color="blue"
              />
              <StatCard
                title="Active Members"
                value={stats.activeMembers.toString()}
                subtitle={pendingMembers.length > 0 ? `${pendingMembers.length} pending` : 'All approved'}
                icon={UsersIcon}
                color="green"
              />
              <StatCard
                title="Total Contributions"
                value={formatCurrency(stats.totalContributions.toString(), 'KES')}
                subtitle="All time"
                icon={CheckCircleIcon}
                color="green"
              />
              <StatCard
                title="Active Loans"
                value={stats.activeLoans.toString()}
                subtitle="Outstanding loans"
                icon={ClockIcon}
                color="yellow"
              />
            </div>

            {/* Group Details */}
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Heading level={3} className="mb-6">Group Information</Heading>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Created</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                    {formatDate(group.createdAt, 'datetime')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Members</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                    {group.currentMemberCount}
                    {group.maxMembers && ` / ${group.maxMembers}`}
                  </dd>
                </div>
                {group.contributionAmount && (
                  <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Contribution Amount
                    </dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                      {formatCurrency(group.contributionAmount, 'KES')}
                      {group.contributionFrequency && ` (${group.contributionFrequency})`}
                    </dd>
                  </div>
                )}
                {group.contributionDay && (
                  <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Contribution Day
                    </dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                      Day {group.contributionDay} of month
                    </dd>
                  </div>
                )}
                {group.location && (
                  <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Location</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                      {group.location}
                    </dd>
                  </div>
                )}
                {group.meetingSchedule && (
                  <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Meeting Schedule
                    </dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                      {group.meetingSchedule}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Settings</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {group.isPublic && <Badge color="blue">Public</Badge>}
                    {group.requiresApproval && <Badge color="yellow">Requires Approval</Badge>}
                    {group.allowLoans && <Badge color="green">Loans Enabled</Badge>}
                  </dd>
                </div>
              </dl>
              {group.rules && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Group Rules
                  </dt>
                  <dd className="mt-2 text-sm text-zinc-900 dark:text-white">
                    <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      {group.rules}
                    </div>
                  </dd>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            {/* Invite Member Button */}
            <div className="mb-6 flex items-center justify-between">
              <Heading level={3}>Members ({activeMembers.length})</Heading>
              <Button onClick={() => setShowInviteModal(true)} color="blue">
                <PlusIcon className="h-5 w-5" />
                Invite Member
              </Button>
            </div>

            {/* Pending Approvals */}
            {pendingMembers.length > 0 && (
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950/50">
                <Heading level={4} className="mb-4 text-yellow-800 dark:text-yellow-200">
                  Pending Approvals ({pendingMembers.length})
                </Heading>
                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg bg-white p-4 dark:bg-zinc-900"
                    >
                      <div>
                        <Text className="font-medium">{member.memberId}</Text>
                        <Text className="text-sm text-zinc-500">Requested {getMemberRoleBadge(member.role)}</Text>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveMember(member.id, true)}
                          color="green"
                          outline
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproveMember(member.id, false)}
                          color="red"
                          outline
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Members Table */}
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Contributed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Withdrawn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Loans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {activeMembers.map((member) => (
                    <tr key={member.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text className="font-medium">{member.memberId}</Text>
                        <Text className="text-xs text-zinc-500">
                          Joined {formatDate(member.joinedAt, 'date')}
                        </Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {updatingRole === member.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as GroupMemberRole)}
                            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <option value="member">Member</option>
                            <option value="secretary">Secretary</option>
                            <option value="treasurer">Treasurer</option>
                            <option value="chairperson">Chairperson</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          getMemberRoleBadge(member.role)
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text className="font-medium">
                          {formatCurrency(member.totalContributed, 'KES')}
                        </Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text>{formatCurrency(member.totalWithdrawn, 'KES')}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text>
                          {formatCurrency(member.totalLoansTaken, 'KES')}
                        </Text>
                        <Text className="text-xs text-zinc-500">
                          Repaid: {formatCurrency(member.totalLoansRepaid, 'KES')}
                        </Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {isAdmin && member.role !== 'admin' && (
                          <Button
                            onClick={() => setUpdatingRole(updatingRole === member.id ? null : member.id)}
                            outline
                            className="text-xs"
                          >
                            {updatingRole === member.id ? 'Cancel' : 'Change Role'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invite Member Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
                  <Heading level={3} className="mb-4">Invite Staff Member</Heading>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Staff ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteStaffId}
                        onChange={(e) => setInviteStaffId(e.target.value)}
                        placeholder="Enter staff member's ID"
                        className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                      <Text className="mt-1 text-xs text-zinc-500">
                        Only staff members from your organization can be invited
                      </Text>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Initial Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as GroupMemberRole)}
                        className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="member">Member</option>
                        <option value="secretary">Secretary</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="chairperson">Chairperson</option>
                      </select>
                      <Text className="mt-1 text-xs text-zinc-500">
                        Members can nominate/elect officials later
                      </Text>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" color="blue" disabled={inviting}>
                        {inviting ? 'Inviting...' : 'Send Invite'}
                      </Button>
                      <Button
                        type="button"
                        outline
                        onClick={() => {
                          setShowInviteModal(false);
                          setInviteStaffId('');
                          setInviteRole('member');
                        }}
                        disabled={inviting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finances' && (
          <div>
            <Heading level={3} className="mb-6">Financial Management</Heading>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <BanknotesIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">Financial Operations</Heading>
              <Text className="mt-2 text-zinc-500">
                Record contributions, manage withdrawals, and handle loan requests
              </Text>
              <div className="mt-6 flex justify-center gap-4">
                <Button color="blue">Record Contribution</Button>
                <Button outline>Request Withdrawal</Button>
                <Button outline>Request Loan</Button>
              </div>
              <Text className="mt-4 text-xs text-zinc-500">
                Financial operations will be implemented in the next phase
              </Text>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <Heading level={3} className="mb-6">Recent Activity</Heading>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <ClockIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">Activity Log</Heading>
              <Text className="mt-2 text-zinc-500">
                View all group activities including contributions, withdrawals, and member changes
              </Text>
              <Text className="mt-4 text-xs text-zinc-500">
                Activity log will be implemented in the next phase
              </Text>
            </div>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
