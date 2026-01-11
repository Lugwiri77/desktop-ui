'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import { createGroup, type CreateGroupInput, GroupType } from '@/lib/groups-api';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function CreateGroupPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateGroupInput>({
    name: '',
    description: '',
    groupType: GroupType.Chama,
    contributionFrequency: 'monthly',
    contributionAmount: '',
    contributionDay: 1,
    maxMembers: undefined,
    isPublic: true,
    requiresApproval: true,
    allowLoans: true,
    location: '',
    meetingSchedule: '',
    rules: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Build input with only defined values
      const input: CreateGroupInput = {
        name: formData.name,
        groupType: formData.groupType,
      };

      if (formData.description) input.description = formData.description;
      if (formData.contributionFrequency) input.contributionFrequency = formData.contributionFrequency;
      if (formData.contributionAmount) input.contributionAmount = formData.contributionAmount;
      if (formData.contributionDay) input.contributionDay = formData.contributionDay;
      if (formData.maxMembers) input.maxMembers = formData.maxMembers;
      if (formData.isPublic !== undefined) input.isPublic = formData.isPublic;
      if (formData.requiresApproval !== undefined) input.requiresApproval = formData.requiresApproval;
      if (formData.allowLoans !== undefined) input.allowLoans = formData.allowLoans;
      if (formData.location) input.location = formData.location;
      if (formData.meetingSchedule) input.meetingSchedule = formData.meetingSchedule;
      if (formData.rules) input.rules = formData.rules;

      const result = await createGroup(input);

      if (result.success && result.group) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/groups/${result.group!.id}`);
        }, 1500);
      } else {
        setError(result.message || 'Failed to create group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mb-6">
        <Button href="/groups" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Groups</span>
        </Button>
      </div>

      <div className="max-w-3xl">
        <Heading>Create New Group</Heading>
        <Text>Set up a new savings group, chama, or investment club</Text>

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
            <Text className="font-medium text-green-800 dark:text-green-200">
              Group created successfully! Redirecting...
            </Text>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
            <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Group Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Staff Savings Group, Investment Chama"
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose and goals of the group"
              rows={3}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Group Type */}
          <div>
            <label
              htmlFor="groupType"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Group Type <span className="text-red-500">*</span>
            </label>
            <select
              id="groupType"
              required
              value={formData.groupType}
              onChange={(e) => setFormData({ ...formData, groupType: e.target.value as GroupType })}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value={GroupType.Chama}>Chama (Community Savings)</option>
              <option value={GroupType.SavingsGroup}>Savings Group</option>
              <option value={GroupType.InvestmentClub}>Investment Club</option>
              <option value={GroupType.Fundraising}>Fundraising Group</option>
            </select>
            <Text className="mt-1 text-xs text-zinc-500">
              Select the type of group you want to create
            </Text>
          </div>

          {/* Contribution Settings Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Contribution Settings</Heading>

            {/* Contribution Frequency */}
            <div className="mb-4">
              <label
                htmlFor="contributionFrequency"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Contribution Frequency
              </label>
              <select
                id="contributionFrequency"
                value={formData.contributionFrequency}
                onChange={(e) => setFormData({ ...formData, contributionFrequency: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Contribution Amount */}
              <div>
                <label
                  htmlFor="contributionAmount"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Contribution Amount (KES)
                </label>
                <input
                  type="number"
                  id="contributionAmount"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                  placeholder="e.g., 1000"
                  step="0.01"
                  min="0"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Contribution Day */}
              <div>
                <label
                  htmlFor="contributionDay"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Contribution Day (1-31)
                </label>
                <input
                  type="number"
                  id="contributionDay"
                  value={formData.contributionDay}
                  onChange={(e) => setFormData({ ...formData, contributionDay: parseInt(e.target.value) })}
                  min="1"
                  max="31"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <Text className="mt-1 text-xs text-zinc-500">
                  Day of month for monthly contributions
                </Text>
              </div>
            </div>
          </div>

          {/* Group Settings Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Group Settings</Heading>

            {/* Max Members */}
            <div className="mb-4">
              <label
                htmlFor="maxMembers"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Maximum Members (Optional)
              </label>
              <input
                type="number"
                id="maxMembers"
                value={formData.maxMembers || ''}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Leave empty for unlimited"
                min="2"
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Make group publicly discoverable</Text>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Require approval for new members</Text>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowLoans}
                  onChange={(e) => setFormData({ ...formData, allowLoans: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Allow members to request loans</Text>
              </label>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Additional Details</Heading>

            {/* Location */}
            <div className="mb-4">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Location (Optional)
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Nairobi, Kenya"
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            {/* Meeting Schedule */}
            <div className="mb-4">
              <label
                htmlFor="meetingSchedule"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Meeting Schedule (Optional)
              </label>
              <input
                type="text"
                id="meetingSchedule"
                value={formData.meetingSchedule}
                onChange={(e) => setFormData({ ...formData, meetingSchedule: e.target.value })}
                placeholder="e.g., Every first Saturday at 10 AM"
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            {/* Rules */}
            <div>
              <label
                htmlFor="rules"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Group Rules (Optional)
              </label>
              <textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Define the rules and regulations for the group"
                rows={4}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
            <Button
              type="button"
              outline
              onClick={() => router.push('/groups')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
