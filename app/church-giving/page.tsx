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
import {
  HeartIcon,
  HandRaisedIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  SparklesIcon,
  ChartBarIcon,
  QrCodeIcon,
  DocumentChartBarIcon,
  UsersIcon,
} from '@heroicons/react/20/solid';

interface GivingStatistics {
  totalCollected: number;
  totalThisMonth: number;
  totalMembers: number;
  averageGiving: number;
  currency: string;
}

interface OfferingTypeStats {
  type: string;
  label: string;
  icon: string;
  amount: number;
  contributorCount: number;
  color: string;
}

interface RecentContribution {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  offeringType: string;
  date: string;
  isAnonymous: boolean;
}

export default function ChurchGivingPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<GivingStatistics | null>(null);
  const [offeringStats, setOfferingStats] = useState<OfferingTypeStats[]>([]);
  const [recentContributions, setRecentContributions] = useState<RecentContribution[]>([]);
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

    // Check if organization is a church/religious institution
    const isChurch =
      info.organizationType?.toLowerCase().includes('church') ||
      info.organizationType?.toLowerCase().includes('religious');
    if (!isChurch) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadGivingData();
  }, [router]);

  const loadGivingData = async () => {
    setLoading(true);
    try {
      // TODO: Implement GraphQL queries for church giving data
      // Mock data for now
      setStatistics({
        totalCollected: 8450000,
        totalThisMonth: 650000,
        totalMembers: 342,
        averageGiving: 24700,
        currency: 'KES',
      });

      setOfferingStats([
        {
          type: 'tithe',
          label: 'Tithe',
          icon: '🙏',
          amount: 4200000,
          contributorCount: 245,
          color: 'blue',
        },
        {
          type: 'offering',
          label: 'General Offering',
          icon: '❤️',
          amount: 2100000,
          contributorCount: 312,
          color: 'green',
        },
        {
          type: 'building_fund',
          label: 'Building Fund',
          icon: '🏗️',
          amount: 1450000,
          contributorCount: 128,
          color: 'purple',
        },
        {
          type: 'missions',
          label: 'Missions',
          icon: '🌍',
          amount: 520000,
          contributorCount: 89,
          color: 'orange',
        },
        {
          type: 'thanksgiving',
          label: 'Thanksgiving',
          icon: '🎉',
          amount: 180000,
          contributorCount: 54,
          color: 'yellow',
        },
      ]);

      setRecentContributions([
        {
          id: '1',
          donorName: 'John Kamau',
          amount: 25000,
          currency: 'KES',
          offeringType: 'Tithe',
          date: new Date().toISOString(),
          isAnonymous: false,
        },
        {
          id: '2',
          donorName: 'Anonymous',
          amount: 15000,
          currency: 'KES',
          offeringType: 'Building Fund',
          date: new Date(Date.now() - 3600000).toISOString(),
          isAnonymous: true,
        },
        {
          id: '3',
          donorName: 'Mary Wanjiru',
          amount: 10000,
          currency: 'KES',
          offeringType: 'General Offering',
          date: new Date(Date.now() - 7200000).toISOString(),
          isAnonymous: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load giving data:', error);
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

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
      green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900',
    };
    return colors[color] || colors.blue;
  };

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Heading>Church Giving & Offerings</Heading>
            <Text className="mt-2">
              Manage offerings, track contributions, and engage with your congregation
            </Text>
            <Badge color="purple" className="mt-2">
              {userInfo.organizationName}
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button href="/wallet/offering" color="blue">
              <QrCodeIcon className="h-5 w-5 mr-2" />
              Generate QR Code
            </Button>
            <Button href="/church-giving/reports" outline>
              <DocumentChartBarIcon className="h-5 w-5 mr-2" />
              View Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : statistics ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Collected"
            value={formatCurrency(statistics.totalCollected, statistics.currency)}
            icon={HeartIcon}
            color="green"
            subtitle="All time"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(statistics.totalThisMonth, statistics.currency)}
            icon={HandRaisedIcon}
            color="blue"
            subtitle="Current month"
          />
          <StatCard
            title="Active Givers"
            value={statistics.totalMembers.toString()}
            icon={UsersIcon}
            color="purple"
            subtitle="Members giving"
          />
          <StatCard
            title="Average Giving"
            value={formatCurrency(statistics.averageGiving, statistics.currency)}
            icon={ChartBarIcon}
            color="orange"
            subtitle="Per member"
          />
        </div>
      ) : null}

      {/* Offering Types Breakdown */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Offerings by Type</Heading>
          <Link href="/church-giving/campaigns">Manage Campaigns →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </>
          ) : offeringStats.length > 0 ? (
            offeringStats.map((offering) => (
              <div
                key={offering.type}
                className={`rounded-lg border-2 p-6 transition hover:shadow-md ${getColorClass(
                  offering.color
                )}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{offering.icon}</span>
                    <Heading level={3} className="text-lg">
                      {offering.label}
                    </Heading>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Text className="text-3xl font-bold">
                      {formatCurrency(offering.amount, 'KES')}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Text className="text-zinc-600 dark:text-zinc-400">
                      {offering.contributorCount} contributors
                    </Text>
                    <Link
                      href={`/church-giving/reports?type=${offering.type}`}
                      className="text-xs"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Recent Contributions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Recent Contributions</Heading>
          <Link href="/payments/transactions">View all →</Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          ) : recentContributions.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentContributions.map((contribution) => (
                  <tr
                    key={contribution.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Text className="font-medium">{contribution.donorName}</Text>
                        {contribution.isAnonymous && (
                          <Badge color="zinc" className="text-xs">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(contribution.amount, contribution.currency)}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm">{contribution.offeringType}</Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(contribution.date, 'datetime')}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <HeartIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">
                No contributions yet
              </Heading>
              <Text className="mt-2 text-zinc-500">
                Contributions will appear here as members give
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <Heading level={2} className="mb-4">
          Quick Actions
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button href="/wallet/offering" outline className="justify-start h-auto py-4">
            <QrCodeIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Generate QR Code</div>
              <div className="text-xs text-zinc-500 mt-1">For offerings during service</div>
            </div>
          </Button>

          <Button href="/church-giving/reports" outline className="justify-start h-auto py-4">
            <DocumentChartBarIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Giving Reports</div>
              <div className="text-xs text-zinc-500 mt-1">Detailed analytics and insights</div>
            </div>
          </Button>

          <Button href="/church-giving/campaigns" outline className="justify-start h-auto py-4">
            <BuildingLibraryIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Campaigns & Projects</div>
              <div className="text-xs text-zinc-500 mt-1">Track special fundraising</div>
            </div>
          </Button>

          <Button href="/church-giving/members" outline className="justify-start h-auto py-4">
            <UsersIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Member Giving</div>
              <div className="text-xs text-zinc-500 mt-1">Track individual contributions</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
    </ApplicationLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</Text>
          <Heading level={2} className="mt-2 text-3xl font-semibold">
            {value}
          </Heading>
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
