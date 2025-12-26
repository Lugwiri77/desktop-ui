'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Select } from '@/app/components/select';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, type UserInfo } from '@/lib/roles';
import { formatCurrency } from '@/lib/formatting-utils';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/20/solid';

interface MonthlyTrend {
  month: string;
  tithe: number;
  offering: number;
  buildingFund: number;
  missions: number;
  total: number;
}

interface TopContributor {
  name: string;
  amount: number;
  contributionCount: number;
}

interface OfferingTypeSummary {
  type: string;
  label: string;
  icon: string;
  totalAmount: number;
  contributorCount: number;
  averageAmount: number;
  trend: number; // percentage change from last period
}

export default function ChurchReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offeringTypeParam = searchParams?.get('type');

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [period, setPeriod] = useState('thisMonth');
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [offeringSummary, setOfferingSummary] = useState<OfferingTypeSummary[]>([]);
  const [selectedType, setSelectedType] = useState(offeringTypeParam || 'all');
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
    loadReportData();
  }, [router, period, selectedType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // TODO: Implement GraphQL queries
      // Mock data
      setMonthlyTrends([
        {
          month: 'Jan 2025',
          tithe: 420000,
          offering: 210000,
          buildingFund: 145000,
          missions: 52000,
          total: 827000,
        },
        {
          month: 'Feb 2025',
          tithe: 445000,
          offering: 225000,
          buildingFund: 160000,
          missions: 58000,
          total: 888000,
        },
        {
          month: 'Mar 2025',
          tithe: 465000,
          offering: 235000,
          buildingFund: 175000,
          missions: 63000,
          total: 938000,
        },
      ]);

      setOfferingSummary([
        {
          type: 'tithe',
          label: 'Tithe',
          icon: '🙏',
          totalAmount: 4200000,
          contributorCount: 245,
          averageAmount: 17143,
          trend: 5.2,
        },
        {
          type: 'offering',
          label: 'General Offering',
          icon: '❤️',
          totalAmount: 2100000,
          contributorCount: 312,
          averageAmount: 6731,
          trend: 3.8,
        },
        {
          type: 'building_fund',
          label: 'Building Fund',
          icon: '🏗️',
          totalAmount: 1450000,
          contributorCount: 128,
          averageAmount: 11328,
          trend: 12.5,
        },
        {
          type: 'missions',
          label: 'Missions',
          icon: '🌍',
          totalAmount: 520000,
          contributorCount: 89,
          averageAmount: 5843,
          trend: -2.1,
        },
      ]);

      setTopContributors([
        { name: 'John Kamau', amount: 150000, contributionCount: 12 },
        { name: 'Mary Wanjiru', amount: 135000, contributionCount: 10 },
        { name: 'Peter Ochieng', amount: 125000, contributionCount: 11 },
        { name: 'Grace Mutua', amount: 115000, contributionCount: 9 },
        { name: 'David Njoroge', amount: 108000, contributionCount: 12 },
      ]);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    // TODO: Implement export functionality
    alert(`Exporting as ${format.toUpperCase()}...`);
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

  const getTotalForPeriod = () => {
    return monthlyTrends.reduce((sum, month) => sum + month.total, 0);
  };

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
            <Heading>Giving Reports & Analytics</Heading>
            <Text className="mt-2">
              Detailed insights into your congregation's giving patterns
            </Text>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => handleExport('pdf')} outline>
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => handleExport('csv')} outline>
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <Label>Period</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </Select>
          </Field>

          <Field>
            <Label>Offering Type</Label>
            <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="tithe">Tithe</option>
              <option value="offering">General Offering</option>
              <option value="building_fund">Building Fund</option>
              <option value="missions">Missions</option>
              <option value="thanksgiving">Thanksgiving</option>
            </Select>
          </Field>

          <Field>
            <Label>Currency</Label>
            <Select value="KES">
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </Select>
          </Field>
        </div>
      </div>

      {/* Summary Cards by Offering Type */}
      <div className="mb-8">
        <Heading level={2} className="mb-4">
          Offering Type Summary
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </>
          ) : (
            offeringSummary.map((offering) => (
              <div
                key={offering.type}
                className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{offering.icon}</span>
                    <Heading level={3} className="text-base">
                      {offering.label}
                    </Heading>
                  </div>
                  <div className="flex items-center gap-1">
                    {offering.trend >= 0 ? (
                      <>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        <Text className="text-xs font-semibold text-green-600">
                          {offering.trend.toFixed(1)}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                        <Text className="text-xs font-semibold text-red-600">
                          {Math.abs(offering.trend).toFixed(1)}%
                        </Text>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Text className="text-2xl font-bold text-blue-600">
                      {formatCurrency(offering.totalAmount, 'KES')}
                    </Text>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <Text className="text-zinc-600 dark:text-zinc-400">Contributors:</Text>
                      <Text className="font-medium">{offering.contributorCount}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-zinc-600 dark:text-zinc-400">Average:</Text>
                      <Text className="font-medium">
                        {formatCurrency(offering.averageAmount, 'KES')}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="mb-8">
        <Heading level={2} className="mb-4">
          Monthly Trends
        </Heading>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="p-8">
              <div className="h-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Month
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Tithe
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Offering
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Building Fund
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Missions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {monthlyTrends.map((month) => (
                    <tr key={month.month} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text className="font-medium">{month.month}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Text className="text-sm">{formatCurrency(month.tithe, 'KES')}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Text className="text-sm">{formatCurrency(month.offering, 'KES')}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Text className="text-sm">{formatCurrency(month.buildingFund, 'KES')}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Text className="text-sm">{formatCurrency(month.missions, 'KES')}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Text className="font-bold text-green-600">
                          {formatCurrency(month.total, 'KES')}
                        </Text>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-100 font-semibold dark:bg-zinc-800">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-bold">Period Total</Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Text className="font-bold">
                        {formatCurrency(
                          monthlyTrends.reduce((sum, m) => sum + m.tithe, 0),
                          'KES'
                        )}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Text className="font-bold">
                        {formatCurrency(
                          monthlyTrends.reduce((sum, m) => sum + m.offering, 0),
                          'KES'
                        )}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Text className="font-bold">
                        {formatCurrency(
                          monthlyTrends.reduce((sum, m) => sum + m.buildingFund, 0),
                          'KES'
                        )}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Text className="font-bold">
                        {formatCurrency(
                          monthlyTrends.reduce((sum, m) => sum + m.missions, 0),
                          'KES'
                        )}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Text className="font-bold text-lg text-green-600">
                        {formatCurrency(getTotalForPeriod(), 'KES')}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Top Contributors</Heading>
          <Badge color="blue">Top 5 Givers</Badge>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.name}
                  className="flex items-center justify-between p-6 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <Text className="font-semibold">{contributor.name}</Text>
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {contributor.contributionCount} contributions
                      </Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text className="text-2xl font-bold text-green-600">
                      {formatCurrency(contributor.amount, 'KES')}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </ApplicationLayout>
  );
}
