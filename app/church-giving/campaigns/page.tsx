'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Badge } from '@/app/components/badge';
import { Link } from '@/app/components/link';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, type UserInfo } from '@/lib/roles';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';
import { calculatePaymentProgress } from '@/lib/payment-utils';
import {
  BuildingLibraryIcon,
  GlobeAltIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/20/solid';

interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  contributorCount: number;
  category: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'upcoming'>(
    'all'
  );
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

    const isChurch =
      info.organizationType?.toLowerCase().includes('church') ||
      info.organizationType?.toLowerCase().includes('religious');
    if (!isChurch) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadCampaigns();
  }, [router]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // TODO: Implement GraphQL query
      // Mock data
      setCampaigns([
        {
          id: '1',
          name: 'New Church Building Fund',
          description: 'Raising funds for our new 500-seater sanctuary',
          goal: 50000000,
          raised: 28500000,
          currency: 'KES',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          status: 'active',
          contributorCount: 245,
          category: 'Building',
        },
        {
          id: '2',
          name: 'Mission Trip to Uganda',
          description: 'Supporting our mission team traveling to Uganda',
          goal: 2500000,
          raised: 2100000,
          currency: 'KES',
          startDate: '2025-02-01',
          endDate: '2025-06-30',
          status: 'active',
          contributorCount: 78,
          category: 'Missions',
        },
        {
          id: '3',
          name: 'Youth Camp 2025',
          description: 'Annual youth camp at the coast',
          goal: 1500000,
          raised: 450000,
          currency: 'KES',
          startDate: '2025-03-01',
          endDate: '2025-08-15',
          status: 'active',
          contributorCount: 42,
          category: 'Youth',
        },
        {
          id: '4',
          name: 'Sound System Upgrade',
          description: 'Upgrading our sanctuary sound system',
          goal: 3500000,
          raised: 3500000,
          currency: 'KES',
          startDate: '2024-10-01',
          endDate: '2025-01-31',
          status: 'completed',
          contributorCount: 156,
          category: 'Equipment',
        },
        {
          id: '5',
          name: 'Christmas Outreach 2025',
          description: 'Blessing needy families during Christmas',
          goal: 2000000,
          raised: 0,
          currency: 'KES',
          startDate: '2025-10-01',
          endDate: '2025-12-25',
          status: 'upcoming',
          contributorCount: 0,
          category: 'Outreach',
        },
      ]);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
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

  const getFilteredCampaigns = () => {
    if (filterStatus === 'all') return campaigns;
    return campaigns.filter((c) => c.status === filterStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'upcoming':
        return 'yellow';
      default:
        return 'zinc';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'building':
        return '🏗️';
      case 'missions':
        return '🌍';
      case 'youth':
        return '👥';
      case 'equipment':
        return '🎵';
      case 'outreach':
        return '❤️';
      default:
        return '📋';
    }
  };

  const filteredCampaigns = getFilteredCampaigns();

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button color="white" className="mb-4" onClick={() => router.push('/church-giving')}>
          ← Back to Church Giving
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <Heading>Campaigns & Projects</Heading>
            <Text className="mt-2">Manage special fundraising campaigns and projects</Text>
          </div>
          <Button href="/church-giving/campaigns/create" color="blue">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        {[
          { value: 'all', label: 'All Campaigns' },
          { value: 'active', label: 'Active' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'completed', label: 'Completed' },
        ].map((filter) => (
          <Button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as any)}
            color={filterStatus === filter.value ? 'dark' : 'white'}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredCampaigns.map((campaign) => {
            const progress = calculatePaymentProgress(campaign.raised, campaign.goal);
            const daysLeft = Math.ceil(
              (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Link
                key={campaign.id}
                href={`/church-giving/campaigns/${campaign.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(campaign.category)}</span>
                    <div>
                      <Heading level={3} className="text-lg">
                        {campaign.name}
                      </Heading>
                      <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                        {campaign.category}
                      </Text>
                    </div>
                  </div>
                  <Badge color={getStatusColor(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>

                {/* Description */}
                <Text className="text-sm mb-4 line-clamp-2">{campaign.description}</Text>

                {/* Progress Bar */}
                {campaign.status !== 'upcoming' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-sm font-medium">
                        {formatCurrency(campaign.raised, campaign.currency)}
                      </Text>
                      <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                        Goal: {formatCurrency(campaign.goal, campaign.currency)}
                      </Text>
                    </div>
                    <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 100
                            ? 'bg-green-600'
                            : progress >= 75
                            ? 'bg-blue-600'
                            : progress >= 50
                            ? 'bg-yellow-600'
                            : 'bg-orange-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Text className="text-xs font-semibold text-blue-600">
                        {progress.toFixed(1)}% Complete
                      </Text>
                      <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(campaign.goal - campaign.raised, campaign.currency)} to go
                      </Text>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-zinc-400" />
                    <Text className="text-zinc-600 dark:text-zinc-400">
                      {campaign.contributorCount} contributors
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-zinc-400" />
                    {campaign.status === 'upcoming' ? (
                      <Text className="text-zinc-600 dark:text-zinc-400">
                        Starts {formatDate(campaign.startDate, 'short')}
                      </Text>
                    ) : campaign.status === 'completed' ? (
                      <Text className="text-zinc-600 dark:text-zinc-400">
                        Ended {formatDate(campaign.endDate, 'short')}
                      </Text>
                    ) : daysLeft > 0 ? (
                      <Text className="text-zinc-600 dark:text-zinc-400">
                        {daysLeft} days left
                      </Text>
                    ) : (
                      <Text className="text-red-600 dark:text-red-400">Ending soon</Text>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Heading level={3} className="mt-4">
            No {filterStatus !== 'all' ? filterStatus : ''} campaigns found
          </Heading>
          <Text className="mt-2 text-zinc-500">
            {filterStatus === 'all'
              ? 'Create your first campaign to start tracking special fundraising projects'
              : `There are no ${filterStatus} campaigns at the moment`}
          </Text>
          {filterStatus === 'all' && (
            <Button href="/church-giving/campaigns/create" className="mt-4" color="blue">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Campaign
            </Button>
          )}
        </div>
      )}
    </div>
    </ApplicationLayout>
  );
}
