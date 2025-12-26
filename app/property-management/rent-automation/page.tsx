'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Link } from '@/app/components/link';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, type UserInfo } from '@/lib/roles';
import { formatCurrency, formatDate } from '@/lib/formatting-utils';
import { graphql } from '@/lib/graphql';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';

interface RentSchedule {
  id: string;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  dayOfMonth: number;
  isActive: boolean;
  nextInvoiceDate: string;
  lastInvoiceDate?: string;
}

export default function RentAutomationPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
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

    if (!info.realEstateBusinessSubcategory) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadSchedulesForUser(info);
  }, [router]);

  const loadSchedulesForUser = async (info: UserInfo) => {
    setLoading(true);
    try {
      // Fetch billing schedules from backend
      const query = `
        query GetBillingSchedules($issuerType: String!, $issuerId: String!, $activeOnly: Boolean) {
          getBillingSchedulesByIssuer(
            issuerType: $issuerType
            issuerId: $issuerId
            activeOnly: $activeOnly
          ) {
            id
            scheduleName
            invoiceType
            description
            amountKes
            frequency
            dueDay
            nextBillingDate
            isActive
            pausedAt
            pausedReason
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphql<{ getBillingSchedulesByIssuer: any[] }>(query, {
        issuerType: 'business_account',
        issuerId: info.organizationId || '',
        activeOnly: false,
      });

      const billingSchedules = result.getBillingSchedulesByIssuer || [];

      // Transform billing schedules to rent schedules format
      // Note: For real implementation, you'd need to join with property/unit/tenant data
      const transformedSchedules: RentSchedule[] = billingSchedules
        .filter((schedule: any) => schedule.invoiceType === 'rent')
        .map((schedule: any) => ({
          id: schedule.id,
          propertyName: schedule.scheduleName || 'Property',
          unitNumber: 'N/A', // TODO: Fetch from tenant/unit relationship
          tenantName: 'Tenant', // TODO: Fetch from tenant data
          amount: parseFloat(schedule.amountKes) || 0,
          currency: 'KES',
          frequency: (schedule.frequency?.toLowerCase() || 'monthly') as 'monthly' | 'quarterly' | 'annually',
          dayOfMonth: schedule.dueDay || 1,
          isActive: schedule.isActive || false,
          nextInvoiceDate: schedule.nextBillingDate || new Date().toISOString(),
          lastInvoiceDate: undefined, // TODO: Fetch from invoice history
        }));

      setSchedules(transformedSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      // Set empty array on error
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    try {
      if (schedule.isActive) {
        // Pause the schedule
        const mutation = `
          mutation PauseBillingSchedule($scheduleId: String!, $reason: String!) {
            pauseBillingSchedule(scheduleId: $scheduleId, reason: $reason) {
              success
              message
            }
          }
        `;

        await graphql<{ pauseBillingSchedule: any }>(mutation, {
          scheduleId,
          reason: 'Manually paused by administrator',
        });
      } else {
        // Resume the schedule
        const mutation = `
          mutation ResumeBillingSchedule($scheduleId: String!) {
            resumeBillingSchedule(scheduleId: $scheduleId) {
              success
              message
            }
          }
        `;

        await graphql<{ resumeBillingSchedule: any }>(mutation, {
          scheduleId,
        });
      }

      // Reload schedules to get updated data
      if (userInfo) {
        loadSchedulesForUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to toggle schedule status:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this rent schedule? This action cannot be undone.')) return;

    try {
      const mutation = `
        mutation DeleteBillingSchedule($scheduleId: String!) {
          deleteBillingSchedule(scheduleId: $scheduleId) {
            success
            message
          }
        }
      `;

      await graphql<{ deleteBillingSchedule: any }>(mutation, {
        scheduleId,
      });

      // Reload schedules to reflect deletion
      if (userInfo) {
        loadSchedulesForUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule. Please try again.');
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

  const getFilteredSchedules = () => {
    if (filterStatus === 'all') return schedules;
    return schedules.filter((s) => (filterStatus === 'active' ? s.isActive : !s.isActive));
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'annually':
        return 'Annually';
      default:
        return frequency;
    }
  };

  const getDaysUntilNext = (nextDate: string) => {
    const days = Math.ceil((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredSchedules = getFilteredSchedules();
  const activeCount = schedules.filter((s) => s.isActive).length;
  const totalRevenue = schedules
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          color="white"
          className="mb-4"
          onClick={() => router.push('/property-management')}
        >
          ← Back to Property Management
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <Heading>Rent Automation</Heading>
            <Text className="mt-2">
              Automate recurring rent invoices for all your properties
            </Text>
          </div>
          <Button href="/property-management/rent-automation/create" color="blue">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Active Schedules
              </Text>
              <Heading level={2} className="mt-2 text-3xl font-semibold">
                {activeCount}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {schedules.length - activeCount} inactive
              </Text>
            </div>
            <div className="rounded-lg p-3 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Monthly Revenue
              </Text>
              <Heading level={2} className="mt-2 text-3xl font-semibold">
                {formatCurrency(totalRevenue, 'KES')}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                From automated rent
              </Text>
            </div>
            <div className="rounded-lg p-3 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Next Invoice Run
              </Text>
              <Heading level={2} className="mt-2 text-3xl font-semibold">
                {(() => {
                  const activeSchedules = schedules.filter((s) => s.isActive);
                  if (activeSchedules.length === 0) return '-';
                  const nextSchedule = activeSchedules.sort(
                    (a, b) => new Date(a.nextInvoiceDate).getTime() - new Date(b.nextInvoiceDate).getTime()
                  )[0];
                  return getDaysUntilNext(nextSchedule.nextInvoiceDate);
                })()}
              </Heading>
              <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {schedules.filter((s) => s.isActive).length === 0 ? 'No active schedules' : 'Days remaining'}
              </Text>
            </div>
            <div className="rounded-lg p-3 bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
              <ClockIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        {[
          { value: 'all', label: 'All Schedules' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
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

      {/* Schedules List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : filteredSchedules.length > 0 ? (
        <div className="space-y-4">
          {filteredSchedules.map((schedule) => {
            const daysUntil = getDaysUntilNext(schedule.nextInvoiceDate);
            return (
              <div
                key={schedule.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Schedule Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Heading level={3} className="text-lg">
                        {schedule.propertyName} - Unit {schedule.unitNumber}
                      </Heading>
                      <Badge color={schedule.isActive ? 'green' : 'zinc'}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Text className="text-zinc-600 dark:text-zinc-400">Tenant</Text>
                        <Text className="font-medium">{schedule.tenantName}</Text>
                      </div>
                      <div>
                        <Text className="text-zinc-600 dark:text-zinc-400">Amount</Text>
                        <Text className="font-semibold text-green-600">
                          {formatCurrency(schedule.amount, schedule.currency)}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-zinc-600 dark:text-zinc-400">Frequency</Text>
                        <Text className="font-medium">
                          {getFrequencyLabel(schedule.frequency)}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-zinc-600 dark:text-zinc-400">Invoice Day</Text>
                        <Text className="font-medium">
                          {schedule.dayOfMonth}
                          {schedule.dayOfMonth === 1
                            ? 'st'
                            : schedule.dayOfMonth === 2
                            ? 'nd'
                            : schedule.dayOfMonth === 3
                            ? 'rd'
                            : 'th'}{' '}
                          of month
                        </Text>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-zinc-400" />
                        <Text className="text-zinc-600 dark:text-zinc-400">
                          Next: {formatDate(schedule.nextInvoiceDate, 'short')}
                          {schedule.isActive && (
                            <span className="ml-2 text-orange-600 font-medium">
                              ({daysUntil} day{daysUntil !== 1 ? 's' : ''})
                            </span>
                          )}
                        </Text>
                      </div>
                      {schedule.lastInvoiceDate && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-zinc-400" />
                          <Text className="text-zinc-600 dark:text-zinc-400">
                            Last: {formatDate(schedule.lastInvoiceDate, 'short')}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleToggleStatus(schedule.id)}
                      color={schedule.isActive ? 'white' : 'blue'}
                      outline
                    >
                      {schedule.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      href={`/property-management/rent-automation/${schedule.id}/edit`}
                      color="white"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(schedule.id)} color="white">
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Heading level={3} className="mt-4">
            No rent schedules found
          </Heading>
          <Text className="mt-2 text-zinc-500">
            {filterStatus === 'all'
              ? 'Create your first rent automation schedule to start generating recurring invoices'
              : `There are no ${filterStatus} rent schedules at the moment`}
          </Text>
          {filterStatus === 'all' && (
            <Button href="/property-management/rent-automation/create" className="mt-4" color="blue">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Schedule
            </Button>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/20">
        <Heading level={3} className="text-blue-900 dark:text-blue-400 mb-3">
          How Rent Automation Works
        </Heading>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              Invoices are automatically generated on the specified day of each month
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>Tenants receive email/SMS notifications when new invoices are created</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              Payment reminders are sent automatically 3 days before and on the due date
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>You can pause or modify schedules at any time</span>
          </li>
        </ul>
      </div>
    </div>
    </ApplicationLayout>
  );
}
