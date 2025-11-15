'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MapPin,
  Building2,
} from 'lucide-react';
import { graphql } from '@/lib/graphql';

// Types
interface VisitorStats {
  currentlyInside: number;
  checkedInToday: number;
  checkedOutToday: number;
  pendingRouting: number;
  inService: number;
  completed: number;
  averageDurationMinutes: number;
  peakHour: string;
  totalThisWeek: number;
  comparisonWithLastWeek: number;
}

interface OrganizationLocation {
  id: string;
  locationCode: string;
  locationName: string;
  locationType?: string;
  city?: string;
  country?: string;
  isActive: boolean;
}

// API function to get organization locations
async function fetchOrganizationLocations() {
  const query = `
    query GetOrganizationLocations {
      organizationLocations {
        id
        locationCode
        locationName
        locationType
        city
        country
        isActive
      }
    }
  `;

  const data = await graphql<{ organizationLocations: OrganizationLocation[] }>(query);
  return data.organizationLocations;
}

// API function to get visitor statistics (with optional location filter)
async function fetchVisitorStatistics(locationId?: string) {
  const query = `
    query GetVisitorStatistics($locationId: ID) {
      visitorStatistics(locationId: $locationId) {
        currentlyInside
        checkedInToday
        checkedOutToday
        pendingRouting
        inService
        completed
        averageDurationMinutes
        peakHour
        totalThisWeek
        comparisonWithLastWeek
      }
    }
  `;

  const data = await graphql<{ visitorStatistics: VisitorStats }>(query, {
    locationId,
  });
  return data.visitorStatistics;
}

export default function VisitorStatsDashboard() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);

  // Fetch organization locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['organizationLocations'],
    queryFn: fetchOrganizationLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes (locations don't change often)
  });

  // Fetch visitor statistics (filtered by location if selected)
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['visitorStatistics', selectedLocationId],
    queryFn: () => fetchVisitorStatistics(selectedLocationId),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const formatDuration = (minutes: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTrendIcon = (comparison: number) => {
    if (comparison > 0) return <ArrowUpRight className="h-4 w-4 text-green-400" />;
    if (comparison < 0) return <ArrowDownRight className="h-4 w-4 text-red-400" />;
    return null;
  };

  const getTrendColor = (comparison: number) => {
    if (comparison > 0) return 'text-green-400';
    if (comparison < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-blue-400" />
            Visitor Statistics
            {isFetching && (
              <span className="text-sm font-normal text-blue-400 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time visitor analytics • Auto-refreshes every 30 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Location Filter */}
          {locations && locations.length > 1 && (
            <select
              value={selectedLocationId || 'all'}
              onChange={(e) => setSelectedLocationId(e.target.value === 'all' ? undefined : e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.locationName} ({location.locationCode})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="h-4 w-24 rounded bg-white/10 mb-3" />
              <div className="h-8 w-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Primary Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Currently Inside */}
            <StatCard
              icon={Users}
              label="Inside Now"
              value={stats?.currentlyInside || 0}
              color="blue"
              emphasis
            />

            {/* Checked In Today */}
            <StatCard
              icon={UserCheck}
              label="Checked In Today"
              value={stats?.checkedInToday || 0}
              color="green"
              subtitle={
                stats?.comparisonWithLastWeek !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${getTrendColor(stats.comparisonWithLastWeek)}`}>
                    {getTrendIcon(stats.comparisonWithLastWeek)}
                    <span>
                      {Math.abs(stats.comparisonWithLastWeek)}% vs last week
                    </span>
                  </div>
                )
              }
            />

            {/* Checked Out Today */}
            <StatCard
              icon={UserX}
              label="Checked Out Today"
              value={stats?.checkedOutToday || 0}
              color="zinc"
            />

            {/* Average Duration */}
            <StatCard
              icon={Clock}
              label="Avg. Duration"
              value={formatDuration(stats?.averageDurationMinutes || 0)}
              color="purple"
              isText
            />
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pending Routing */}
            <SecondaryStatCard
              label="Pending Routing"
              value={stats?.pendingRouting || 0}
              color="yellow"
              icon="⏳"
            />

            {/* In Service */}
            <SecondaryStatCard
              label="In Service"
              value={stats?.inService || 0}
              color="purple"
              icon="🔄"
            />

            {/* Completed Today */}
            <SecondaryStatCard
              label="Completed Today"
              value={stats?.completed || 0}
              color="green"
              icon="✓"
            />
          </div>

          {/* Weekly Summary */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-400">This Week's Traffic</h3>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats?.totalThisWeek?.toLocaleString() || 0}
                </p>
                {stats?.comparisonWithLastWeek !== undefined && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${getTrendColor(stats.comparisonWithLastWeek)}`}>
                    {getTrendIcon(stats.comparisonWithLastWeek)}
                    <span className="font-medium">
                      {Math.abs(stats.comparisonWithLastWeek)}% {stats.comparisonWithLastWeek > 0 ? 'increase' : 'decrease'}
                    </span>
                    <span className="text-zinc-500">from last week</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
                {stats?.peakHour && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Peak: {stats.peakHour}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location Breakdown - Only show when viewing all locations */}
          {!selectedLocationId && locations && locations.length > 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">Location Breakdown</h3>
                <span className="text-sm text-zinc-500">
                  ({locations.length} locations)
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onSelect={() => setSelectedLocationId(location.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Primary Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isText = false,
  emphasis = false,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'zinc' | 'purple' | 'yellow';
  isText?: boolean;
  emphasis?: boolean;
  subtitle?: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  };

  const borderClasses = {
    blue: 'border-blue-500/30',
    green: 'border-green-500/30',
    zinc: 'border-white/10',
    purple: 'border-purple-500/30',
    yellow: 'border-yellow-500/30',
  };

  return (
    <div className={`rounded-xl border ${emphasis ? borderClasses[color] : 'border-white/10'} bg-zinc-900 p-6 ${emphasis ? 'ring-2 ring-blue-500/20' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className={`mt-2 ${isText ? 'text-2xl' : 'text-4xl'} font-bold text-white`}>
            {value}
          </p>
          {subtitle && <div className="mt-2">{subtitle}</div>}
        </div>
        <div className={`rounded-xl ${colorClasses[color]} p-3`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Secondary Stat Card Component
function SecondaryStatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'yellow' | 'purple' | 'green';
  icon: string;
}) {
  const bgClasses = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    green: 'bg-green-500/10 border-green-500/30',
  };

  const textClasses = {
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <div className={`rounded-lg border ${bgClasses[color]} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${textClasses[color]}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// Location Card Component with Stats
function LocationCard({
  location,
  onSelect,
}: {
  location: OrganizationLocation;
  onSelect: () => void;
}) {
  // Fetch stats for this specific location
  const { data: locationStats, isLoading } = useQuery({
    queryKey: ['visitorStatistics', location.id],
    queryFn: () => fetchVisitorStatistics(location.id),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  return (
    <button
      onClick={onSelect}
      className="group relative rounded-xl border border-white/10 bg-zinc-900 p-5 text-left transition-all hover:border-blue-500/50 hover:bg-zinc-800"
    >
      {/* Location Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              {location.locationName}
            </h4>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Code: {location.locationCode}
          </p>
          {location.city && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {location.city}{location.country ? `, ${location.country}` : ''}
            </p>
          )}
        </div>
        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
          {location.locationType || 'Location'}
        </span>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500">Inside Now</p>
            <p className="mt-1 text-xl font-bold text-white">
              {locationStats?.currentlyInside || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Today</p>
            <p className="mt-1 text-xl font-bold text-green-400">
              {locationStats?.checkedInToday || 0}
            </p>
          </div>
        </div>
      )}

      {/* Click indicator */}
      <div className="mt-4 flex items-center justify-end gap-1 text-xs text-zinc-600 group-hover:text-blue-400 transition-colors">
        <span>View details</span>
        <ArrowUpRight className="h-3 w-3" />
      </div>
    </button>
  );
}
