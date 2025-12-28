'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Badge } from '@/app/components/badge';
import { Divider } from '@/app/components/divider';
import { Select } from '@/app/components/select';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isEducationInstitution, isPrimaryOrSecondarySchool, type UserInfo } from '@/lib/roles';
import { formatCurrency } from '@/lib/formatting-utils';
import { getFeeCollectionTrends, getClassPerformance, getRecentFeeTransactions, getFeeStatistics, graphql } from '@/lib/education-api';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FeeStatistics {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  studentsWithArrears: number;
  totalStudents: number;
  totalFeesAssigned: number;
  averageFeePerStudent: number;
  currency: string;
}

interface InstitutionStatistics {
  totalStudents: number;
  activeStudents: number;
  studentsCheckedIn: number;
  studentsOnCampus: number;
}

interface CollectionTrend {
  month: string;
  collected: number;
  pending: number;
  target: number;
}

interface ClassCollection {
  class: string;
  collected: number;
  pending: number;
  total: number;
  percentage: number;
}

interface RecentTransaction {
  id: string;
  studentName: string;
  amount: number;
  type: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};

export default function EducationDashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [feeStatistics, setFeeStatistics] = useState<FeeStatistics | null>(null);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStatistics | null>(null);
  const [collectionTrends, setCollectionTrends] = useState<CollectionTrend[]>([]);
  const [classCollections, setClassCollections] = useState<ClassCollection[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Academic year and term selection
  const currentYear = new Date().getFullYear();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(`${currentYear}/${currentYear + 1}`);
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');

  // Generate academic year options (current year ± 2 years)
  const academicYearOptions = [
    { value: `${currentYear - 2}/${currentYear - 1}`, label: `${currentYear - 2}/${currentYear - 1}` },
    { value: `${currentYear - 1}/${currentYear}`, label: `${currentYear - 1}/${currentYear}` },
    { value: `${currentYear}/${currentYear + 1}`, label: `${currentYear}/${currentYear + 1}` },
    { value: `${currentYear + 1}/${currentYear + 2}`, label: `${currentYear + 1}/${currentYear + 2}` },
  ];

  const termOptions = [
    { value: 'TERM_1', label: 'Term 1' },
    { value: 'TERM_2', label: 'Term 2' },
    { value: 'TERM_3', label: 'Term 3' },
  ];

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

    if (!isEducationInstitution(info.accountType, info.organizationType)) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadDashboardData(info);
  }, [router]);

  // Reload data when academic year or term changes
  useEffect(() => {
    if (userInfo) {
      loadDashboardData(userInfo);
    }
  }, [selectedAcademicYear, selectedTerm]);

  const loadDashboardData = async (info: UserInfo) => {
    setLoading(true);
    try {
      if (!info.organizationId) {
        console.error('No institution ID found');
        return;
      }

      // Use selected academic year and term
      const academicYear = selectedAcademicYear;
      const term = selectedTerm;

      const [feeStatsData, institutionStatsData, trendsData, classData, transactionsData] = await Promise.all([
        // Fee Statistics
        getFeeStatistics(info.organizationId, academicYear, term)
          .catch(err => {
            console.error('Failed to load fee statistics:', err);
            return null;
          }),

        // Institution Statistics
        graphql<{ getInstitutionStatistics: any }>(`
          query GetInstitutionStatistics($institutionId: String!) {
            getInstitutionStatistics(institutionId: $institutionId) {
              totalStudents
              studentsCheckedIn
              pendingApprovals
              todaysActivities
            }
          }
        `, { institutionId: info.organizationId })
          .then(data => data.getInstitutionStatistics)
          .catch(err => {
            console.error('Failed to load institution statistics:', err);
            return null;
          }),

        // Collection Trends
        getFeeCollectionTrends(info.organizationId, academicYear)
          .catch(err => {
            console.error('Failed to load collection trends:', err);
            return [];
          }),

        // Class Performance
        getClassPerformance(info.organizationId, academicYear, term)
          .catch(err => {
            console.error('Failed to load class performance:', err);
            return [];
          }),

        // Recent Transactions
        getRecentFeeTransactions(info.organizationId, 10)
          .catch(err => {
            console.error('Failed to load recent transactions:', err);
            return [];
          }),
      ]);

      if (feeStatsData) {
        setFeeStatistics({
          totalCollected: feeStatsData.totalCollectedKes || 0,
          totalPending: feeStatsData.totalPendingKes || 0,
          totalOverdue: feeStatsData.totalOverdueKes || 0,
          studentsWithArrears: feeStatsData.studentsWithArrears || 0,
          totalStudents: feeStatsData.totalStudentsWithFees || 0,
          totalFeesAssigned: feeStatsData.totalFeeAssignments || 0,
          averageFeePerStudent: feeStatsData.totalExpectedKes && feeStatsData.totalStudentsWithFees
            ? feeStatsData.totalExpectedKes / feeStatsData.totalStudentsWithFees
            : 0,
          currency: 'KES',
        });
      }

      if (institutionStatsData) {
        setInstitutionStats({
          totalStudents: institutionStatsData.totalStudents || 0,
          activeStudents: institutionStatsData.totalStudents || 0, // Use total students as fallback
          studentsCheckedIn: institutionStatsData.studentsCheckedIn || 0,
          studentsOnCampus: institutionStatsData.studentsCheckedIn || 0, // Use checked in as fallback
        });
      }

      // Update collection trends
      if (Array.isArray(trendsData) && trendsData.length > 0) {
        setCollectionTrends(trendsData);
      }

      // Update class performance
      if (Array.isArray(classData) && classData.length > 0) {
        const mappedClasses = classData.map((item: any) => ({
          class: item.className || item.class_name || 'Unknown',
          collected: item.collected || 0,
          pending: item.pending || 0,
          total: item.total || 0,
          percentage: item.percentage || 0,
        }));
        setClassCollections(mappedClasses);
      }

      // Update recent transactions
      if (Array.isArray(transactionsData) && transactionsData.length > 0) {
        const mappedTransactions = transactionsData.map((item: any) => ({
          id: item.id,
          studentName: item.studentName || item.student_name || 'Unknown',
          amount: item.amount || 0,
          type: item.feeType || item.fee_type || 'Fee',
          date: item.date || new Date().toISOString(),
          status: (item.status === 'paid' ? 'paid' : item.status === 'overdue' ? 'overdue' : 'pending') as 'paid' | 'pending' | 'overdue',
        }));
        setRecentTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setFeeStatistics({
        totalCollected: 0,
        totalPending: 0,
        totalOverdue: 0,
        studentsWithArrears: 0,
        totalStudents: 0,
        totalFeesAssigned: 0,
        averageFeePerStudent: 0,
        currency: 'KES',
      });
      setInstitutionStats({
        totalStudents: 0,
        activeStudents: 0,
        studentsCheckedIn: 0,
        studentsOnCampus: 0,
      });
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

  const paymentStatusData = feeStatistics ? [
    { name: 'Collected', value: feeStatistics.totalCollected, color: COLORS.success },
    { name: 'Pending', value: feeStatistics.totalPending, color: COLORS.warning },
    { name: 'Overdue', value: feeStatistics.totalOverdue, color: COLORS.danger },
  ] : [];

  const collectionRate = feeStatistics
    ? ((feeStatistics.totalCollected / (feeStatistics.totalCollected + feeStatistics.totalPending)) * 100).toFixed(1)
    : '0';

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Heading className="text-3xl font-bold">Education Analytics</Heading>
              <Text className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Real-time insights into your institution's performance and financials
              </Text>
              <div className="mt-3 flex items-center gap-3">
                <Badge color="blue">{getSchoolTypeLabel()}</Badge>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Academic Year:</label>
                  <Select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-40"
                  >
                    {academicYearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Term:</label>
                  <Select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-32"
                  >
                    {termOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button href="/school-fees" color="blue">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Manage Fees
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))
          ) : (
            <>
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(feeStatistics?.totalCollected || 0, 'KES')}
                change="+12.5%"
                trend="up"
                icon={BanknotesIcon}
                color="green"
                subtitle="This term"
              />
              <MetricCard
                title="Collection Rate"
                value={`${collectionRate}%`}
                change="+3.2%"
                trend="up"
                icon={ChartBarIcon}
                color="blue"
                subtitle={`${feeStatistics?.totalFeesAssigned || 0} fees assigned`}
              />
              <MetricCard
                title="Pending Payments"
                value={formatCurrency(feeStatistics?.totalPending || 0, 'KES')}
                change="-8.1%"
                trend="down"
                icon={ClockIcon}
                color="yellow"
                subtitle={`${feeStatistics?.studentsWithArrears || 0} students`}
              />
              <MetricCard
                title="Active Students"
                value={institutionStats?.activeStudents.toString() || '0'}
                change="+2.4%"
                trend="up"
                icon={UserGroupIcon}
                color="purple"
                subtitle={`${institutionStats?.studentsCheckedIn || 0} present today`}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Fee Collection Trends */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Heading level={3} className="text-xl font-semibold">Fee Collection Trends</Heading>
                <Text className="mt-1 text-sm text-zinc-500">Monthly collection vs targets</Text>
              </div>
              <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                <option>Last 6 months</option>
                <option>Last 12 months</option>
                <option>This year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={collectionTrends}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value, 'KES')}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke={COLORS.success}
                  fill="url(#colorCollected)"
                  name="Collected"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke={COLORS.warning}
                  fill="url(#colorPending)"
                  name="Pending"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={COLORS.primary}
                  strokeDasharray="5 5"
                  name="Target"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status Breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6">
              <Heading level={3} className="text-xl font-semibold">Payment Status</Heading>
              <Text className="mt-1 text-sm text-zinc-500">Current term breakdown</Text>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, 'KES')} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              {paymentStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-sm">{item.name}</Text>
                  </div>
                  <Text className="text-sm font-semibold">
                    {formatCurrency(item.value, 'KES')}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Performance & Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Class-wise Collection */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Heading level={3} className="text-xl font-semibold">Class Performance</Heading>
                <Text className="mt-1 text-sm text-zinc-500">Fee collection by class</Text>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="class" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value, 'KES')}
                />
                <Legend />
                <Bar dataKey="collected" fill={COLORS.success} name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Heading level={3} className="text-xl font-semibold">Recent Transactions</Heading>
                <Text className="mt-1 text-sm text-zinc-500">Latest fee payments</Text>
              </div>
              <Button href="/school-fees" plain>View all</Button>
            </div>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-2 ${
                      transaction.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/50'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/50'
                    }`}>
                      <CurrencyDollarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Text className="font-medium">{transaction.studentName}</Text>
                      <Text className="text-sm text-zinc-500">{transaction.type} • {transaction.date}</Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text className="font-semibold">{formatCurrency(transaction.amount, 'KES')}</Text>
                    <Badge
                      color={
                        transaction.status === 'paid'
                          ? 'green'
                          : transaction.status === 'pending'
                          ? 'yellow'
                          : 'red'
                      }
                      className="mt-1"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Classes Table */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Heading level={3} className="text-xl font-semibold">Top Performing Classes</Heading>
              <Text className="mt-1 text-sm text-zinc-500">Ranked by collection percentage</Text>
            </div>
            <Button href="/school-fees/reports" outline>Full Report</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rank</th>
                  <th className="pb-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Class</th>
                  <th className="pb-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Fees</th>
                  <th className="pb-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">Collected</th>
                  <th className="pb-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pending</th>
                  <th className="pb-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {classCollections
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((classData, index) => (
                    <tr key={classData.class} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-4">
                        <Badge color={index === 0 ? 'green' : index === 1 ? 'blue' : 'zinc'}>
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Text className="font-medium">{classData.class}</Text>
                      </td>
                      <td className="py-4 text-right">
                        <Text className="text-sm">{formatCurrency(classData.total, 'KES')}</Text>
                      </td>
                      <td className="py-4 text-right">
                        <Text className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(classData.collected, 'KES')}
                        </Text>
                      </td>
                      <td className="py-4 text-right">
                        <Text className="text-sm text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(classData.pending, 'KES')}
                        </Text>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${classData.percentage}%` }}
                            />
                          </div>
                          <Text className="text-sm font-semibold">{classData.percentage}%</Text>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Generate Invoices"
            description="Create invoices for pending fees"
            icon={BanknotesIcon}
            href="/school-fees/bulk-invoice"
            color="blue"
          />
          <QuickActionCard
            title="Student Accounts"
            description="Manage individual student fees"
            icon={UserGroupIcon}
            href="/school-fees/students"
            color="purple"
          />
          <QuickActionCard
            title="Fee Structures"
            description="Configure fee templates"
            icon={AcademicCapIcon}
            href="/school-fees/structure"
            color="cyan"
          />
          <QuickActionCard
            title="Reports"
            description="View detailed analytics"
            icon={ChartBarIcon}
            href="/school-fees/reports"
            color="green"
          />
        </div>
      </div>
    </ApplicationLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue' | 'yellow' | 'purple';
  subtitle: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  };

  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          {change}
        </div>
      </div>
      <div>
        <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</Text>
        <Heading level={2} className="mt-2 text-3xl font-bold">
          {value}
        </Heading>
        <Text className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</Text>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'blue' | 'purple' | 'cyan' | 'green';
}

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  };

  return (
    <a
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className={`inline-flex rounded-lg p-3 mb-4 ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <Heading level={3} className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {title}
      </Heading>
      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </Text>
    </a>
  );
}
