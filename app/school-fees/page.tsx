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
import { loadUserInfo, isEducationInstitution, isPrimaryOrSecondarySchool, type UserInfo } from '@/lib/roles';
import { formatCurrency } from '@/lib/formatting-utils';
import { graphql } from '@/lib/graphql';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/20/solid';

interface FeeStatistics {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  studentsWithArrears: number;
  currency: string;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  currency: string;
  gradeLevel: string;
  term: string;
  isActive: boolean;
}

export default function SchoolFeesPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<FeeStatistics | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
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

    // Check if user's organization is an educational institution
    if (!isEducationInstitution(info.accountType, info.organizationType)) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadSchoolFeeData(info.organizationId);
  }, [router]);

  const loadSchoolFeeData = async (institutionId: string) => {
    setLoading(true);
    try {
      if (!institutionId) {
        console.error('No institution ID found');
        return;
      }

      // Get current academic year and term
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}/${currentYear + 1}`;
      const term = 'TERM_1'; // TODO: Make this dynamic based on current date

      // Fetch real data from backend using graphql helper
      const [statsData, structuresData] = await Promise.all([
        graphql<{ getFeeStatistics: any }>(`
          query GetFeeStatistics($institutionId: String!, $academicYear: String!, $term: AcademicTermEnum!) {
            getFeeStatistics(institutionId: $institutionId, academicYear: $academicYear, term: $term) {
              totalCollectedKes
              totalPendingKes
              studentsWithArrears
            }
          }
        `, {
          institutionId: institutionId,
          academicYear,
          term,
        }),

        graphql<{ getFeeStructures: any[] }>(`
          query GetFeeStructures($institutionId: String!, $isActive: Boolean) {
            getFeeStructures(institutionId: $institutionId, isActive: $isActive) {
              id
              feeName
              amountKes
              gradeLevel
              term
              academicYear
              isActive
            }
          }
        `, {
          institutionId: institutionId,
          isActive: true,
        }),
      ]);

      // Process statistics
      if (statsData?.getFeeStatistics) {
        const stats = statsData.getFeeStatistics;
        setStatistics({
          totalCollected: stats.totalCollectedKes || 0,
          totalPending: stats.totalPendingKes || 0,
          totalOverdue: 0, // Calculate from pending if needed
          studentsWithArrears: stats.studentsWithArrears || 0,
          currency: 'KES',
        });
      }

      // Process fee structures
      if (structuresData?.getFeeStructures) {
        const structures = structuresData.getFeeStructures.map((fee: any) => ({
          id: fee.id,
          name: fee.feeName,
          amount: parseFloat(fee.amountKes || '0'),
          currency: 'KES',
          gradeLevel: fee.gradeLevel || 'All Grades',
          term: `${fee.term.replace('_', ' ')} ${fee.academicYear}`,
          isActive: fee.isActive,
        }));
        setFeeStructures(structures);
      }
    } catch (error) {
      console.error('Failed to load school fee data:', error);
      // Set empty data on error
      setStatistics({
        totalCollected: 0,
        totalPending: 0,
        totalOverdue: 0,
        studentsWithArrears: 0,
        currency: 'KES',
      });
      setFeeStructures([]);
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

  const getSchoolTypeLabel = () => {
    if (isPrimaryOrSecondarySchool(userInfo)) {
      return userInfo.educationalInstitutionSubcategory === 'PrimarySchool'
        ? 'Primary School'
        : 'Secondary School';
    }
    return 'Educational Institution';
  };

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Heading>School Fees Management</Heading>
            <Text className="mt-2">
              Manage fee structures, generate invoices, and track student payments
            </Text>
            <Badge color="blue" className="mt-2">{getSchoolTypeLabel()}</Badge>
          </div>
          <div className="flex gap-3">
            <Button href="/school-fees/structure/create" color="blue">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Fee Structure
            </Button>
            <Button href="/school-fees/bulk-invoice" outline>
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Bulk Invoice
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
            icon={CurrencyDollarIcon}
            color="green"
            subtitle="This term"
          />
          <StatCard
            title="Pending Fees"
            value={formatCurrency(statistics.totalPending, statistics.currency)}
            icon={DocumentTextIcon}
            color="yellow"
            subtitle="Awaiting payment"
          />
          <StatCard
            title="Overdue Amount"
            value={formatCurrency(statistics.totalOverdue, statistics.currency)}
            icon={ChartBarIcon}
            color="red"
            subtitle="Requires follow-up"
          />
          <StatCard
            title="Students in Arrears"
            value={statistics.studentsWithArrears.toString()}
            icon={UserGroupIcon}
            color="orange"
            subtitle="Need attention"
          />
        </div>
      ) : null}

      {/* Fee Structures */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Fee Structures</Heading>
          <Link href="/school-fees/structure">View all →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </>
          ) : feeStructures.length > 0 ? (
            feeStructures.map((fee) => (
              <Link
                key={fee.id}
                href={`/school-fees/structure/${fee.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                    <Heading level={3} className="text-lg">
                      {fee.name}
                    </Heading>
                  </div>
                  <Badge color={fee.isActive ? 'green' : 'zinc'}>
                    {fee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <Text className="text-2xl font-bold text-blue-600">
                      {formatCurrency(fee.amount, fee.currency)}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Text className="text-zinc-600 dark:text-zinc-400">
                      {fee.gradeLevel}
                    </Text>
                    <Text className="text-zinc-600 dark:text-zinc-400">
                      {fee.term}
                    </Text>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3">
              <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-zinc-400" />
                <Heading level={3} className="mt-4">
                  No Fee Structures Yet
                </Heading>
                <Text className="mt-2 text-zinc-500">
                  Create fee structures for different grades and terms
                </Text>
                <Button href="/school-fees/structure/create" className="mt-4" color="blue">
                  Create Fee Structure
                </Button>
              </div>
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
          <Button href="/school-fees/students" outline className="justify-start h-auto py-4">
            <UserGroupIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Student Accounts</div>
              <div className="text-xs text-zinc-500 mt-1">Manage student fee accounts</div>
            </div>
          </Button>

          <Button href="/school-fees/reports" outline className="justify-start h-auto py-4">
            <ChartBarIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Fee Reports</div>
              <div className="text-xs text-zinc-500 mt-1">View collection reports by class</div>
            </div>
          </Button>

          <Button href="/school-fees/bulk-invoice" outline className="justify-start h-auto py-4">
            <DocumentTextIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Bulk Invoicing</div>
              <div className="text-xs text-zinc-500 mt-1">Generate invoices for entire classes</div>
            </div>
          </Button>

          <Button href="/school-fees/guardians" outline className="justify-start h-auto py-4">
            <UserGroupIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Guardian Portal</div>
              <div className="text-xs text-zinc-500 mt-1">Manage guardian access</div>
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
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'orange';
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
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
