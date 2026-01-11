'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import {
  getCampaign,
  getCampaignStats,
  getCampaignDonations,
  makeDonation,
  type FundraisingCampaign,
  type CampaignStats,
  type CampaignDonation,
  type MakeDonationInput,
  CampaignStatus,
  CampaignVerificationStatus,
} from '@/lib/groups-api';
import {
  ArrowLeftIcon,
  HeartIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  BanknotesIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';

function getCampaignStatusBadge(status: CampaignStatus) {
  const colorMap: Record<CampaignStatus, 'green' | 'yellow' | 'red' | 'zinc' | 'blue'> = {
    [CampaignStatus.Draft]: 'zinc',
    [CampaignStatus.Active]: 'green',
    [CampaignStatus.Paused]: 'yellow',
    [CampaignStatus.Completed]: 'blue',
    [CampaignStatus.Cancelled]: 'red',
  };
  const labelMap: Record<CampaignStatus, string> = {
    [CampaignStatus.Draft]: 'Draft',
    [CampaignStatus.Active]: 'Active',
    [CampaignStatus.Paused]: 'Paused',
    [CampaignStatus.Completed]: 'Completed',
    [CampaignStatus.Cancelled]: 'Cancelled',
  };
  return <Badge color={colorMap[status]}>{labelMap[status]}</Badge>;
}

function getVerificationBadge(status: CampaignVerificationStatus) {
  const colorMap: Record<CampaignVerificationStatus, 'green' | 'yellow' | 'red'> = {
    [CampaignVerificationStatus.Pending]: 'yellow',
    [CampaignVerificationStatus.Verified]: 'green',
    [CampaignVerificationStatus.Rejected]: 'red',
  };
  const labelMap: Record<CampaignVerificationStatus, string> = {
    [CampaignVerificationStatus.Pending]: 'Pending Verification',
    [CampaignVerificationStatus.Verified]: 'Verified',
    [CampaignVerificationStatus.Rejected]: 'Rejected',
  };
  return <Badge color={colorMap[status]}>{labelMap[status]}</Badge>;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [campaign, setCampaign] = useState<FundraisingCampaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donation form state
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);

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

  // Load campaign data
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!userInfo || !campaignId) return;

      setLoading(true);
      setError(null);

      try {
        const [campaignData, statsData, donationsData] = await Promise.all([
          getCampaign(campaignId),
          getCampaignStats(campaignId),
          getCampaignDonations(campaignId),
        ]);

        setCampaign(campaignData);
        setStats(statsData);
        setDonations(donationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign data');
        console.error('Failed to load campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [userInfo, campaignId]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign || !donationAmount) return;

    setDonating(true);
    try {
      const input: MakeDonationInput = {
        campaignId: campaign.id,
        amount: donationAmount,
        isAnonymous,
      };

      if (donationMessage) {
        input.message = donationMessage;
        input.showMessagePublicly = true;
      }

      const result = await makeDonation(input);

      if (result.success) {
        // Refresh campaign data
        const [updatedCampaign, updatedStats, updatedDonations] = await Promise.all([
          getCampaign(campaignId),
          getCampaignStats(campaignId),
          getCampaignDonations(campaignId),
        ]);

        setCampaign(updatedCampaign);
        setStats(updatedStats);
        setDonations(updatedDonations);

        setShowDonateModal(false);
        setDonationAmount('');
        setDonationMessage('');
        setIsAnonymous(false);

        alert('Thank you for your donation!');
      } else {
        alert(result.message || 'Failed to process donation');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process donation');
    } finally {
      setDonating(false);
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
            <Text className="mt-4">Loading campaign...</Text>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error || !campaign || !stats) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="mb-6">
          <Button href="/campaigns" outline>
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="ml-2">Back to Campaigns</span>
          </Button>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/50">
          <Heading level={3} className="text-red-800 dark:text-red-200">
            {error || 'Campaign not found'}
          </Heading>
        </div>
      </ApplicationLayout>
    );
  }

  const progress = parseFloat(stats.progressPercentage);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      {/* Header */}
      <div className="mb-6">
        <Button href="/campaigns" outline>
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="ml-2">Back to Campaigns</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Cover Image */}
          {campaign.coverImageUrl && (
            <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <img
                src={campaign.coverImageUrl}
                alt={campaign.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Title and Badges */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {getCampaignStatusBadge(campaign.status)}
              {getVerificationBadge(campaign.verificationStatus)}
              {campaign.category && <Badge color="blue">{campaign.category}</Badge>}
            </div>
            <Heading level={1}>{campaign.title}</Heading>
            {campaign.beneficiaryName && (
              <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
                <UserIcon className="mr-1 inline h-4 w-4" />
                Beneficiary: {campaign.beneficiaryName}
              </Text>
            )}
          </div>

          {/* Description */}
          {campaign.description && (
            <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Heading level={3} className="mb-3">About this campaign</Heading>
              <Text className="whitespace-pre-wrap">{campaign.description}</Text>
            </div>
          )}

          {/* Story */}
          {campaign.story && (
            <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Heading level={3} className="mb-3">Full Story</Heading>
              <Text className="whitespace-pre-wrap">{campaign.story}</Text>
            </div>
          )}

          {/* Campaign Details */}
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-4">Campaign Details</Heading>
            <dl className="space-y-3">
              {campaign.location && (
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    <MapPinIcon className="mr-2 h-4 w-4" />
                    Location
                  </dt>
                  <dd className="ml-auto text-sm text-zinc-900 dark:text-white">
                    {campaign.location}
                  </dd>
                </div>
              )}
              <div className="flex items-start">
                <dt className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Created
                </dt>
                <dd className="ml-auto text-sm text-zinc-900 dark:text-white">
                  {formatDate(campaign.createdAt, 'date')}
                </dd>
              </div>
              {campaign.endDate && (
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    End Date
                  </dt>
                  <dd className="ml-auto text-sm text-zinc-900 dark:text-white">
                    {formatDate(campaign.endDate, 'date')}
                    {stats.daysRemaining > 0 && (
                      <span className="ml-2 text-zinc-500">({stats.daysRemaining} days left)</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Recent Donations */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-4">Recent Donations ({donations.length})</Heading>
            {donations.length > 0 ? (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="border-b border-zinc-200 pb-4 last:border-0 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Text className="font-medium">
                          {donation.isAnonymous ? 'Anonymous' : donation.donorName || 'Anonymous'}
                        </Text>
                        <Text className="text-sm text-zinc-500">
                          {formatDate(donation.donatedAt, 'datetime')}
                        </Text>
                      </div>
                      <Text className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(donation.amount, campaign.currency || 'KES')}
                      </Text>
                    </div>
                    {donation.message && donation.showMessagePublicly && (
                      <Text className="mt-2 text-sm italic text-zinc-600 dark:text-zinc-400">
                        "{donation.message}"
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Text className="text-center text-zinc-500">
                Be the first to donate to this campaign!
              </Text>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Donation Card */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4">
                <Text className="text-3xl font-bold">
                  {formatCurrency(campaign.currentAmount, campaign.currency || 'KES')}
                </Text>
                <Text className="text-sm text-zinc-500">
                  raised of {formatCurrency(campaign.targetAmount, campaign.currency || 'KES')} goal
                </Text>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {Math.round(progress)}% funded
                </Text>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-2xl font-semibold">{stats.totalDonations}</Text>
                  <Text className="text-sm text-zinc-500">donations</Text>
                </div>
                <div>
                  <Text className="text-2xl font-semibold">{stats.totalDonors}</Text>
                  <Text className="text-sm text-zinc-500">donors</Text>
                </div>
              </div>

              {/* Donate Button */}
              {campaign.status === CampaignStatus.Active &&
                campaign.verificationStatus === CampaignVerificationStatus.Verified && (
                  <Button
                    onClick={() => setShowDonateModal(true)}
                    color="blue"
                    className="w-full"
                  >
                    <HeartIcon className="h-5 w-5" />
                    Donate Now
                  </Button>
                )}

              {campaign.status !== CampaignStatus.Active && (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950/50">
                  <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                    This campaign is not currently accepting donations
                  </Text>
                </div>
              )}

              {campaign.verificationStatus !== CampaignVerificationStatus.Verified && (
                <div className="mt-3 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950/50">
                  <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                    This campaign is pending verification
                  </Text>
                </div>
              )}
            </div>

            {/* Average Donation */}
            {stats.averageDonation && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <Text className="text-sm text-zinc-500">Average donation</Text>
                  <Text className="font-semibold">
                    {formatCurrency(stats.averageDonation, campaign.currency || 'KES')}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
            <Heading level={3} className="mb-4">Make a Donation</Heading>
            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount ({campaign.currency || 'KES'}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Message (Optional)
                </label>
                <textarea
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                  placeholder="Leave a message of support"
                  rows={3}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                />
                <Text className="ml-2 text-sm">Donate anonymously</Text>
              </label>
              <div className="flex gap-2 pt-4">
                <Button type="submit" color="blue" disabled={donating}>
                  {donating ? 'Processing...' : 'Donate'}
                </Button>
                <Button
                  type="button"
                  outline
                  onClick={() => {
                    setShowDonateModal(false);
                    setDonationAmount('');
                    setDonationMessage('');
                    setIsAnonymous(false);
                  }}
                  disabled={donating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ApplicationLayout>
  );
}
