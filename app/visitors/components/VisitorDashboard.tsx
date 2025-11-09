'use client';

import { Badge } from '@/app/components/badge';
import { VisitorLog, VisitorStats } from '@/lib/visitor-management';
import { GranularPermissions } from '@/lib/graphql';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface VisitorDashboardProps {
  activeVisitors: VisitorLog[];
  stats: VisitorStats | undefined;
  permissions: GranularPermissions | null;
}

export default function VisitorDashboard({
  activeVisitors,
  stats,
  permissions,
}: VisitorDashboardProps) {
  // Filter visitors by status
  const checkedIn = activeVisitors.filter(v => v.status === 'checked_in');
  const pendingRouting = activeVisitors.filter(v => v.status === 'pending_routing');
  const routed = activeVisitors.filter(v => v.status === 'routed');
  const inService = activeVisitors.filter(v => v.status === 'in_service');
  const completed = activeVisitors.filter(v => v.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {permissions?.can_view_visitor_analytics && stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Pending Routing"
            value={stats.pendingRouting}
            icon={ClockIcon}
            color="amber"
          />
          <StatCard
            title="In Service"
            value={stats.inService}
            icon={ArrowPathIcon}
            color="indigo"
          />
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            icon={CheckCircleIcon}
            color="green"
          />
          <StatCard
            title="Checked Out Today"
            value={stats.checkedOutToday}
            icon={CheckCircleIcon}
            color="emerald"
          />
        </div>
      )}

      {/* Active Visitors List */}
      <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
          Active Visitors
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          All visitors currently in the facility
        </p>

        <div className="mt-6">
          {activeVisitors.length === 0 ? (
            <div className="rounded-md bg-zinc-50 p-8 text-center dark:bg-zinc-800">
              <UserGroupIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                No active visitors
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeVisitors.map((visitor) => (
                <VisitorCard key={visitor.id} visitor={visitor} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status-based Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Routing */}
        {pendingRouting.length > 0 && (
          <StatusSection
            title="Pending Routing"
            count={pendingRouting.length}
            visitors={pendingRouting}
            badgeColor="amber"
          />
        )}

        {/* In Service */}
        {inService.length > 0 && (
          <StatusSection
            title="In Service"
            count={inService.length}
            visitors={inService}
            badgeColor="blue"
          />
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <StatusSection
            title="Service Completed"
            count={completed.length}
            visitors={completed}
            badgeColor="green"
          />
        )}
      </div>
    </div>
  );
}

// Helper Components

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'amber' | 'indigo' | 'green';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    green: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </p>
        <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
      </div>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

interface VisitorCardProps {
  visitor: VisitorLog;
}

function VisitorCard({ visitor }: VisitorCardProps) {
  const statusColors = {
    checked_in: 'zinc',
    pending_routing: 'amber',
    routed: 'amber',
    in_service: 'blue',
    transferred: 'indigo',
    completed: 'green',
    checked_out: 'zinc',
  } as const;

  const elapsedTime = Math.round(
    (Date.now() - new Date(visitor.entryTime).getTime()) / 1000 / 60
  );

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-medium text-zinc-950 dark:text-white">
              {visitor.visitorFullName}
            </p>
            <Badge color={statusColors[visitor.status]}>
              {visitor.status.replace('_', ' ')}
            </Badge>
            {visitor.otpVerified && (
              <Badge color="green" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          <div className="mt-2 grid gap-1 text-sm">
            <p className="text-zinc-600 dark:text-zinc-400">
              Phone: {visitor.visitorPhoneNumber}
            </p>
            {visitor.visitorEmail && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Email: {visitor.visitorEmail}
              </p>
            )}
            {visitor.purposeOfVisit && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Purpose: {visitor.purposeOfVisit}
              </p>
            )}
            {visitor.destinationDepartment && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Department: {visitor.destinationDepartment.name}
              </p>
            )}
            {visitor.destinationStaff && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Staff: {visitor.destinationStaff.firstName} {visitor.destinationStaff.lastName}
              </p>
            )}
            {visitor.destinationOfficeLocation && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Location: {visitor.destinationOfficeLocation}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Entered: {new Date(visitor.entryTime).toLocaleTimeString()}
            </span>
            <span>
              Elapsed: {elapsedTime} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusSectionProps {
  title: string;
  count: number;
  visitors: VisitorLog[];
  badgeColor: 'amber' | 'blue' | 'green';
}

function StatusSection({ title, count, visitors, badgeColor }: StatusSectionProps) {
  return (
    <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
          {title}
        </h3>
        <Badge color={badgeColor}>{count}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        {visitors.map((visitor) => (
          <div
            key={visitor.id}
            className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <p className="font-medium text-zinc-950 dark:text-white">
              {visitor.visitorFullName}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {visitor.visitorPhoneNumber}
            </p>
            {visitor.purposeOfVisit && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {visitor.purposeOfVisit}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
