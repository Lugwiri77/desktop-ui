'use client';

import { useState, useEffect } from 'react';
import { Heading } from './heading';
import { Text } from './text';
import { Badge } from './badge';
import { getInvitationStats, type InvitationStats as StatsType } from '@/lib/invitation-api';
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/20/solid';

interface InvitationStatsProps {
  organizationType: 'business' | 'institution';
  organizationId: string;
}

export function InvitationStatsCard({
  organizationType,
  organizationId,
}: InvitationStatsProps) {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [organizationType, organizationId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getInvitationStats(organizationType, organizationId);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 text-red-600">
          <XCircleIcon className="h-5 w-5" />
          <Text className="text-sm">
            {error || 'Failed to load invitation statistics'}
          </Text>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Invitations',
      value: stats.totalInvitations,
      icon: EnvelopeIcon,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending',
      value: stats.pendingInvitations,
      icon: ClockIcon,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Accepted',
      value: stats.acceptedInvitations,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Expired',
      value: stats.expiredInvitations,
      icon: XCircleIcon,
      color: 'bg-gray-50 text-gray-600',
    },
  ];

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <Heading level={3}>Invitation Statistics</Heading>
            <Text className="text-sm text-gray-500">User registration metrics</Text>
          </div>
        </div>

        {/* Acceptance Rate Badge */}
        <div className="text-right">
          <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Acceptance Rate
          </Text>
          <Badge className={getAcceptanceRateColor(stats.acceptanceRate)}>
            {stats.acceptanceRate.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`rounded-lg p-2 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <Text className="text-sm text-gray-500">{item.label}</Text>
            </div>
            <Text className="text-2xl font-semibold">{item.value}</Text>
          </div>
        ))}
      </div>

      {/* Summary Bar */}
      {stats.totalInvitations > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-700">
              Registration Progress
            </Text>
            <Text className="text-sm text-gray-500">
              {stats.acceptedInvitations} of {stats.totalInvitations} registered
            </Text>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{
                width: `${
                  (stats.acceptedInvitations / stats.totalInvitations) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* No Data Message */}
      {stats.totalInvitations === 0 && (
        <div className="text-center py-8 border-t border-gray-100">
          <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <Text className="text-sm text-gray-500">
            No invitations sent yet. Start inviting users to register on the mobile app.
          </Text>
        </div>
      )}
    </div>
  );
}
