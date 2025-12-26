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
import { graphql } from '@/lib/graphql';
import {
  HomeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BoltIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/20/solid';

interface PropertyStatistics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalRentCollected: number;
  pendingRent: number;
  overdueRent: number;
  currency: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  currency: string;
}

interface RecentTransaction {
  id: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  currency: string;
  type: string;
  date: string;
  status: string;
}

export default function PropertyManagementPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<PropertyStatistics | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
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

    // Check if organization is real estate
    if (!info.realEstateBusinessSubcategory) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
    loadPropertyData();
  }, [router]);

  const loadPropertyData = async () => {
    setLoading(true);
    try {
      // Fetch properties from backend
      const propertiesQuery = `
        query GetMyProperties {
          getMyProperties {
            id
            propertyName
            propertyType
            address
            city
            county
            totalUnits
            totalParkingSpaces
            createdAt
          }
        }
      `;

      const propertiesResult = await graphql<{ getMyProperties: any[] }>(propertiesQuery, {});
      const fetchedProperties = propertiesResult.getMyProperties || [];

      // Fetch statistics for each property
      const propertiesWithStats = await Promise.all(
        fetchedProperties.map(async (prop: any) => {
          try {
            const statsQuery = `
              query GetPropertyStats($propertyId: String!) {
                getPropertyStatistics(propertyId: $propertyId) {
                  propertyId
                  propertyName
                  totalUnits
                  actualUnits
                  occupiedUnits
                  availableUnits
                  totalTenants
                  activeTenants
                  totalParkingSpaces
                  availableParking
                  currentVisitors
                }
              }
            `;

            const statsResult = await graphql<{ getPropertyStatistics: any }>(
              statsQuery,
              { propertyId: prop.id }
            );

            const stats = statsResult.getPropertyStatistics;

            return {
              id: prop.id,
              name: prop.propertyName,
              address: `${prop.city}, ${prop.county}`,
              totalUnits: stats?.totalUnits || prop.totalUnits || 0,
              occupiedUnits: stats?.occupiedUnits || 0,
              monthlyRevenue: 0, // Will be calculated from rent schedules
              currency: 'KES',
            };
          } catch (error) {
            console.error(`Failed to load stats for property ${prop.id}:`, error);
            return {
              id: prop.id,
              name: prop.propertyName,
              address: `${prop.city}, ${prop.county}`,
              totalUnits: prop.totalUnits || 0,
              occupiedUnits: 0,
              monthlyRevenue: 0,
              currency: 'KES',
            };
          }
        })
      );

      setProperties(propertiesWithStats);

      // Calculate aggregate statistics
      const totalUnits = propertiesWithStats.reduce((sum, p) => sum + p.totalUnits, 0);
      const occupiedUnits = propertiesWithStats.reduce((sum, p) => sum + p.occupiedUnits, 0);
      const vacantUnits = totalUnits - occupiedUnits;

      setStatistics({
        totalProperties: propertiesWithStats.length,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        totalRentCollected: 0, // TODO: Calculate from payment transactions
        pendingRent: 0, // TODO: Calculate from pending invoices
        overdueRent: 0, // TODO: Calculate from overdue invoices
        currency: 'KES',
      });

      // TODO: Fetch recent transactions from payment system
      // For now, show empty transactions
      setRecentTransactions([]);
    } catch (error) {
      console.error('Failed to load property data:', error);
      // Set empty data on error
      setProperties([]);
      setStatistics({
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        totalRentCollected: 0,
        pendingRent: 0,
        overdueRent: 0,
        currency: 'KES',
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

  const getOccupancyRate = () => {
    if (!statistics) return 0;
    return (statistics.occupiedUnits / statistics.totalUnits) * 100;
  };

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Heading>Property Management Dashboard</Heading>
            <Text className="mt-2">Manage properties, tenants, and rent collection</Text>
            <Badge color="purple" className="mt-2">
              {userInfo.realEstateBusinessSubcategory?.replace(/([A-Z])/g, ' $1').trim()}
            </Badge>
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
            title="Total Rent Collected"
            value={formatCurrency(statistics.totalRentCollected, statistics.currency)}
            icon={CurrencyDollarIcon}
            color="green"
            subtitle="This month"
          />
          <StatCard
            title="Pending Rent"
            value={formatCurrency(statistics.pendingRent, statistics.currency)}
            icon={CalendarIcon}
            color="yellow"
            subtitle={`${statistics.totalUnits - statistics.occupiedUnits} vacant units`}
          />
          <StatCard
            title="Overdue Rent"
            value={formatCurrency(statistics.overdueRent, statistics.currency)}
            icon={ExclamationTriangleIcon}
            color="red"
            subtitle="Requires attention"
          />
          <StatCard
            title="Occupancy Rate"
            value={`${getOccupancyRate().toFixed(1)}%`}
            icon={HomeIcon}
            color="blue"
            subtitle={`${statistics.occupiedUnits}/${statistics.totalUnits} units occupied`}
          />
        </div>
      ) : null}

      {/* Properties Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Properties</Heading>
          <Link href="/property-management/properties">View all →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </>
          ) : properties.length > 0 ? (
            properties.map((property) => {
              const occupancyRate = (property.occupiedUnits / property.totalUnits) * 100;
              return (
                <Link
                  key={property.id}
                  href={`/property-management/properties/${property.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <HomeIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <Heading level={3} className="text-lg">
                          {property.name}
                        </Heading>
                        <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                          {property.address}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Text className="text-2xl font-bold text-green-600">
                        {formatCurrency(property.monthlyRevenue, property.currency)}
                      </Text>
                      <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                        Monthly revenue
                      </Text>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <Text className="font-medium">
                          {property.occupiedUnits}/{property.totalUnits} Units
                        </Text>
                        <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                          {occupancyRate.toFixed(0)}% occupancy
                        </Text>
                      </div>
                      <Badge color={occupancyRate >= 90 ? 'green' : occupancyRate >= 70 ? 'yellow' : 'red'}>
                        {property.totalUnits - property.occupiedUnits} vacant
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-3">
              <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                <HomeIcon className="mx-auto h-12 w-12 text-zinc-400" />
                <Heading level={3} className="mt-4">
                  No properties yet
                </Heading>
                <Text className="mt-2 text-zinc-500">
                  Add your first property to start managing rentals
                </Text>
                <Button href="/property-management/properties/create" className="mt-4" color="blue">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2}>Recent Transactions</Heading>
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
          ) : recentTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Property / Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-medium">{transaction.tenantName}</Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <Text className="text-sm font-medium">{transaction.propertyName}</Text>
                        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                          Unit {transaction.unitNumber}
                        </Text>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm">{transaction.type}</Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="font-semibold">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge color={transaction.status === 'completed' ? 'green' : 'yellow'}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(transaction.date, 'datetime')}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Heading level={4} className="mt-4">
                No transactions yet
              </Heading>
              <Text className="mt-2 text-zinc-500">
                Transactions will appear here as tenants make payments
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
          <Button href="/property-management/properties" outline className="justify-start h-auto py-4">
            <HomeIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Manage Properties</div>
              <div className="text-xs text-zinc-500 mt-1">View and edit property details</div>
            </div>
          </Button>

          <Button href="/property-management/tenants" outline className="justify-start h-auto py-4">
            <UsersIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Tenant Portal</div>
              <div className="text-xs text-zinc-500 mt-1">Manage tenant accounts</div>
            </div>
          </Button>

          <Button
            href="/property-management/rent-automation"
            outline
            className="justify-start h-auto py-4"
          >
            <CalendarIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Rent Automation</div>
              <div className="text-xs text-zinc-500 mt-1">Setup recurring invoices</div>
            </div>
          </Button>

          <Button href="/property-management/utilities" outline className="justify-start h-auto py-4">
            <BoltIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Utility Billing</div>
              <div className="text-xs text-zinc-500 mt-1">Manage water, electricity bills</div>
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
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
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
