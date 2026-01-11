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
  listCampaigns,
  getMyCampaigns,
  type FundraisingCampaign,
  CampaignStatus,
  CampaignVerificationStatus,
} from '@/lib/groups-api';
import {
  HeartIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  BanknotesIcon,
  UsersIcon,
} from '@heroicons/react/20/solid';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';

function getCampaignStatusBadge(status: CampaignStatus) {
  const colorMap: Record<CampaignStatus, 'green' | 'yellow' | 'red' | 'zinc'> = {
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

interface CampaignCardProps {
  campaign: FundraisingCampaign;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = campaign.targetAmount
    ? (parseFloat(campaign.currentAmount) / parseFloat(campaign.targetAmount)) * 100
    : 0;

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {campaign.coverImageUrl && (
        <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Heading level={4} className="line-clamp-2">{campaign.title}</Heading>
          {campaign.category && (
            <Text className="mt-1 text-xs text-zinc-500">{campaign.category}</Text>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {getCampaignStatusBadge(campaign.status)}
          {campaign.verificationStatus === CampaignVerificationStatus.Verified && (
            <Badge color="green" className="text-xs">
              <CheckCircleIcon className="mr-1 inline h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      {campaign.description && (
        <Text className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {campaign.description}
        </Text>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <Text className="font-medium">
            {formatCurrency(campaign.currentAmount, campaign.currency || 'KES')}
          </Text>
          <Text className="text-zinc-500">
            of {formatCurrency(campaign.targetAmount, campaign.currency || 'KES')}
          </Text>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{Math.round(progress)}% funded</span>
          <span>{campaign.totalDonors} donors</span>
        </div>
      </div>

      {campaign.endDate && (
        <div className="mt-3 flex items-center text-xs text-zinc-500">
          <ClockIcon className="mr-1 h-4 w-4" />
          Ends {formatDate(campaign.endDate, 'date')}
        </div>
      )}
    </Link>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
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

export default function CampaignsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-campaigns'>('discover');
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<FundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!userInfo) return;

      setLoading(true);
      try {
        if (activeTab === 'discover') {
          const publicCampaigns = await listCampaigns();
          setCampaigns(publicCampaigns);
        } else {
          const userCampaigns = await getMyCampaigns();
          setMyCampaigns(userCampaigns);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [userInfo, activeTab]);

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

  const displayCampaigns = activeTab === 'discover' ? campaigns : myCampaigns;
  const filteredCampaigns = searchTerm
    ? displayCampaigns.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : displayCampaigns;

  // Calculate statistics for my campaigns
  const myStats = {
    totalCampaigns: myCampaigns.length,
    activeCampaigns: myCampaigns.filter(c => c.status === CampaignStatus.Active).length,
    totalRaised: myCampaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0),
    totalDonors: myCampaigns.reduce((sum, c) => sum + c.totalDonors, 0),
  };

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Fundraising Campaigns</Heading>
          <Text>Discover campaigns or create your own to raise funds for a cause</Text>
        </div>
        <Button href="/campaigns/create" color="blue">
          <PlusIcon className="h-5 w-5" />
          Create Campaign
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('discover')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'discover'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <SparklesIcon className="mr-2 inline h-5 w-5" />
            Discover Campaigns
          </button>
          <button
            onClick={() => setActiveTab('my-campaigns')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
              activeTab === 'my-campaigns'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <HeartIcon className="mr-2 inline h-5 w-5" />
            My Campaigns
            {myCampaigns.length > 0 && (
              <Badge color="blue" className="ml-2">
                {myCampaigns.length}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'my-campaigns' && (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Campaigns"
              value={myStats.totalCampaigns.toString()}
              subtitle={`${myStats.activeCampaigns} active`}
              icon={HeartIcon}
              color="purple"
            />
            <StatCard
              title="Active Campaigns"
              value={myStats.activeCampaigns.toString()}
              subtitle="Currently fundraising"
              icon={CheckCircleIcon}
              color="green"
            />
            <StatCard
              title="Total Raised"
              value={formatCurrency(myStats.totalRaised.toString(), 'KES')}
              subtitle="Across all campaigns"
              icon={BanknotesIcon}
              color="blue"
            />
            <StatCard
              title="Total Donors"
              value={myStats.totalDonors.toString()}
              subtitle="All contributions"
              icon={UsersIcon}
              color="yellow"
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search campaigns by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <HeartIcon className="mx-auto h-16 w-16 text-zinc-400" />
            <Heading level={3} className="mt-4">
              {searchTerm
                ? 'No campaigns found'
                : activeTab === 'discover'
                ? 'No campaigns available'
                : 'No campaigns yet'}
            </Heading>
            <Text className="mt-2 text-zinc-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : activeTab === 'discover'
                ? 'Check back later for new campaigns'
                : 'Create your first campaign to start fundraising'}
            </Text>
            {activeTab === 'my-campaigns' && !searchTerm && (
              <Button href="/campaigns/create" color="blue" className="mt-6">
                <PlusIcon className="h-5 w-5" />
                Create Your First Campaign
              </Button>
            )}
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
