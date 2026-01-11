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
import {
  createCampaign,
  type CreateCampaignInput,
} from '@/lib/groups-api';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateCampaignInput>({
    title: '',
    description: '',
    targetAmount: '',
    currency: 'KES',
    isPublic: true,
    allowAnonymousDonations: true,
    showDonorNames: true,
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
      const input: CreateCampaignInput = {
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
      };

      if (formData.story) input.story = formData.story;
      if (formData.category) input.category = formData.category;
      if (formData.currency) input.currency = formData.currency;
      if (formData.isPublic !== undefined) input.isPublic = formData.isPublic;
      if (formData.allowAnonymousDonations !== undefined) input.allowAnonymousDonations = formData.allowAnonymousDonations;
      if (formData.showDonorNames !== undefined) input.showDonorNames = formData.showDonorNames;
      if (formData.beneficiaryName) input.beneficiaryName = formData.beneficiaryName;
      if (formData.beneficiaryContact) input.beneficiaryContact = formData.beneficiaryContact;
      if (formData.beneficiaryIdNumber) input.beneficiaryIdNumber = formData.beneficiaryIdNumber;
      if (formData.coverImageUrl) input.coverImageUrl = formData.coverImageUrl;
      if (formData.endDate) input.endDate = formData.endDate;
      if (formData.location) input.location = formData.location;
      if (formData.tags && formData.tags.length > 0) input.tags = formData.tags;

      const result = await createCampaign(input);

      if (result.success && result.campaign) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/campaigns/${result.campaign!.id}`);
        }, 1500);
      } else {
        setError(result.message || 'Failed to create campaign');
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
        <Button href="/campaigns" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Campaigns</span>
        </Button>
      </div>

      <div className="max-w-3xl">
        <Heading>Create Fundraising Campaign</Heading>
        <Text>Create a campaign to raise funds for a cause or project</Text>

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
            <Text className="font-medium text-green-800 dark:text-green-200">
              Campaign created successfully! Redirecting...
            </Text>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
            <Text className="font-medium text-red-800 dark:text-red-200">{error}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Campaign Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Campaign Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Help Fund Medical Treatment, School Building Project"
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief summary of the campaign (2-3 sentences)"
              rows={3}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Full Story */}
          <div>
            <label
              htmlFor="story"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Full Story (Optional)
            </label>
            <textarea
              id="story"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Tell the complete story behind this campaign..."
              rows={8}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <Text className="mt-1 text-xs text-zinc-500">
              Share details about why you're fundraising and how the funds will be used
            </Text>
          </div>

          {/* Fundraising Goal Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Fundraising Goal</Heading>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Target Amount */}
              <div>
                <label
                  htmlFor="targetAmount"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Target Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="targetAmount"
                  required
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="e.g., 100000"
                  step="0.01"
                  min="1"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Currency */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
            </div>

            {/* End Date */}
            <div className="mt-4">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                End Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
              <Text className="mt-1 text-xs text-zinc-500">
                Leave empty for ongoing campaigns
              </Text>
            </div>
          </div>

          {/* Beneficiary Information Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Beneficiary Information</Heading>

            <div className="space-y-4">
              {/* Beneficiary Name */}
              <div>
                <label
                  htmlFor="beneficiaryName"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Beneficiary Name (Optional)
                </label>
                <input
                  type="text"
                  id="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  placeholder="Name of the person or organization benefiting"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Beneficiary Contact */}
              <div>
                <label
                  htmlFor="beneficiaryContact"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Contact Information (Optional)
                </label>
                <input
                  type="text"
                  id="beneficiaryContact"
                  value={formData.beneficiaryContact}
                  onChange={(e) => setFormData({ ...formData, beneficiaryContact: e.target.value })}
                  placeholder="Phone number or email"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Beneficiary ID Number */}
              <div>
                <label
                  htmlFor="beneficiaryIdNumber"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  ID Number (Optional)
                </label>
                <input
                  type="text"
                  id="beneficiaryIdNumber"
                  value={formData.beneficiaryIdNumber}
                  onChange={(e) => setFormData({ ...formData, beneficiaryIdNumber: e.target.value })}
                  placeholder="National ID or registration number"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <Text className="mt-1 text-xs text-zinc-500">
                  For verification purposes
                </Text>
              </div>
            </div>
          </div>

          {/* Campaign Details Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Campaign Details</Heading>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Category (Optional)
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Medical, Education, Community"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Location */}
              <div>
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

              {/* Cover Image URL */}
              <div>
                <label
                  htmlFor="coverImageUrl"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <Text className="mt-1 text-xs text-zinc-500">
                  Add a compelling image to attract donors
                </Text>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                    })
                  }
                  placeholder="medical, urgent, community (comma-separated)"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <Text className="mt-1 text-xs text-zinc-500">
                  Add tags separated by commas to help people find your campaign
                </Text>
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <Heading level={4} className="mb-4">Privacy Settings</Heading>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Make campaign publicly visible</Text>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowAnonymousDonations}
                  onChange={(e) =>
                    setFormData({ ...formData, allowAnonymousDonations: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Allow anonymous donations</Text>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.showDonorNames}
                  onChange={(e) => setFormData({ ...formData, showDonorNames: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Show donor names publicly</Text>
              </label>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/50">
            <Text className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Your campaign will be submitted for verification before going live.
              This helps ensure authenticity and builds trust with donors.
            </Text>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
            <Button
              type="button"
              outline
              onClick={() => router.push('/campaigns')}
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
