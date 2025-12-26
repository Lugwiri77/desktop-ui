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
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, type UserInfo } from '@/lib/roles';
import { graphql } from '@/lib/graphql';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

interface Property {
  id: string;
  propertyName: string;
  address: string;
  city: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  monthlyRent?: string;
  bedrooms?: number;
  unitType?: string;
}

interface Tenant {
  id: string;
  firstName?: string;
  lastName?: string;
  unitId: string;
  personalAccountId?: string;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly' | 'Annually'>('Monthly');
  const [dueDay, setDueDay] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [attemptedLinking, setAttemptedLinking] = useState<Set<string>>(new Set());
  const [linkingInProgress, setLinkingInProgress] = useState(false);
  const [linkingSuccess, setLinkingSuccess] = useState(false);

  // Calculate next occurrence of the due day
  const calculateNextStartDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    let nextDate = new Date(today.getFullYear(), today.getMonth(), day);

    // If the date has passed this month, move to next month
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }

    // Format date as YYYY-MM-DD in local timezone
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(nextDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${dayStr}`;
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    loadProperties(info);

    // Set initial start date to next occurrence of day 1
    setStartDate(calculateNextStartDate(1));
  }, [router]);

  const loadProperties = async (info: UserInfo) => {
    setLoading(true);
    try {
      const query = `
        query GetMyProperties {
          getMyProperties {
            id
            propertyName
            address
            city
          }
        }
      `;

      const result = await graphql<{ getMyProperties: Property[] }>(query, {});
      setProperties(result.getMyProperties || []);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async (propertyId: string) => {
    try {
      const query = `
        query GetUnitsByProperty($propertyId: String!) {
          getUnitsByProperty(propertyId: $propertyId) {
            id
            unitNumber
            propertyId
            monthlyRent
            bedrooms
            unitType
          }
        }
      `;

      const result = await graphql<{ getUnitsByProperty: Unit[] }>(query, {
        propertyId,
      });
      setUnits(result.getUnitsByProperty || []);
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    }
  };

  const loadTenants = async (unitId: string) => {
    try {
      const query = `
        query GetTenantByUnit($unitId: String!) {
          getTenantByUnit(unitId: $unitId) {
            id
            firstName
            lastName
            unitId
            personalAccountId
          }
        }
      `;

      const result = await graphql<{ getTenantByUnit: Tenant | null }>(query, {
        unitId,
      });

      // Backend returns a single tenant or null, convert to array for consistency
      if (result.getTenantByUnit) {
        const tenant = result.getTenantByUnit;
        setTenants([tenant]);

        // Automatically attempt to link tenant if they don't have a personal account
        // Only attempt once per tenant to avoid infinite loops
        if (!tenant.personalAccountId && !attemptedLinking.has(tenant.id)) {
          console.log('Tenant has no personal account, attempting auto-link...');
          await attemptAutoLinkTenant(tenant.id, unitId);
        }
      } else {
        setTenants([]);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    }
  };

  const attemptAutoLinkTenant = async (tenantId: string, unitId: string) => {
    // Mark this tenant as attempted to prevent multiple tries
    setAttemptedLinking(prev => new Set(prev).add(tenantId));
    setLinkingInProgress(true);
    setLinkingSuccess(false);

    try {
      const mutation = `
        mutation AutoLinkTenant($tenantId: String!) {
          autoLinkTenantToPersonalAccount(tenantId: $tenantId) {
            success
            message
            id
          }
        }
      `;

      const result = await graphql<{ autoLinkTenantToPersonalAccount: any }>(mutation, {
        tenantId,
      });

      if (result.autoLinkTenantToPersonalAccount.success) {
        console.log('✅ Auto-link successful:', result.autoLinkTenantToPersonalAccount.message);
        setLinkingSuccess(true);

        // Reload tenant data to get updated personalAccountId
        const query = `
          query GetTenantByUnit($unitId: String!) {
            getTenantByUnit(unitId: $unitId) {
              id
              firstName
              lastName
              unitId
              personalAccountId
            }
          }
        `;

        const updatedResult = await graphql<{ getTenantByUnit: Tenant | null }>(query, {
          unitId,
        });

        if (updatedResult.getTenantByUnit) {
          setTenants([updatedResult.getTenantByUnit]);
        }
      }
    } catch (error) {
      console.log('⚠️ Auto-link failed (tenant may not have matching personal account):', error);
      // Silently fail - this is expected when no matching account exists
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handlePropertyChange = async (propertyId: string) => {
    setSelectedProperty(propertyId);
    setSelectedUnit('');
    setSelectedTenant('');
    setUnits([]);
    setTenants([]);

    if (propertyId) {
      await loadUnits(propertyId);

      // Auto-generate schedule name
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setScheduleName(`${property.propertyName} - Rent`);
      }
    }
  };

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedTenant('');
    setTenants([]);

    if (unitId) {
      await loadTenants(unitId);

      // Update schedule name and auto-fill rent amount
      const property = properties.find(p => p.id === selectedProperty);
      const unit = units.find(u => u.id === unitId);
      if (property && unit) {
        setScheduleName(`${property.propertyName} - Unit ${unit.unitNumber} Rent`);

        // Auto-fill rent amount from unit if available
        if (unit.monthlyRent) {
          console.log('Auto-filling rent amount:', unit.monthlyRent);
          setAmount(unit.monthlyRent);
        } else {
          console.log('No monthly rent set for this unit');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProperty || !selectedUnit || !amount || !startDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Get tenant's personal account ID if available
    const tenant = tenants.find(t => t.id === selectedTenant);
    const recipientId = tenant?.personalAccountId || '';

    // Validate that we have a recipient with a personal account
    if (!recipientId) {
      alert(
        'Cannot create billing schedule: The tenant for this unit does not have a personal account yet.\n\n' +
        'The tenant needs to register on the mobile app or have a personal account created before automated billing can be set up.\n\n' +
        'Tenant: ' + (tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Not assigned')
      );
      return;
    }

    setSubmitting(true);
    try {
      const mutation = `
        mutation CreateBillingSchedule($input: CreateBillingScheduleInput!) {
          createBillingSchedule(input: $input) {
            id
            scheduleName
            amountKes
            frequency
          }
        }
      `;

      await graphql<{ createBillingSchedule: any }>(mutation, {
        input: {
          scheduleName,
          description: description || `Automated rent billing for unit`,
          invoiceType: 'rent',
          issuerType: 'business_account',
          issuerId: userInfo?.organizationId || '',
          recipientType: 'personal_account',
          recipientId: recipientId,
          amountKes: amount,
          frequency: frequency.toLowerCase(),
          dueDay,
          startDate,
        },
      });

      setSuccess(true);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule. Please try again.');
    } finally {
      setSubmitting(false);
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

  if (success) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
            <Heading className="mt-4">Schedule Created Successfully!</Heading>
            <Text className="mt-4">
              Your rent automation schedule has been created and is now active.
              Invoices will be generated automatically on the {dueDay}
              {dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'} of each month.
            </Text>
            <div className="mt-8 flex gap-3 justify-center">
              <Button href="/property-management/rent-automation" color="blue">
                View All Schedules
              </Button>
              <Button href="/property-management/rent-automation/create" outline>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            color="white"
            className="mb-4"
            onClick={() => router.push('/property-management/rent-automation')}
          >
            ← Back to Rent Automation
          </Button>
          <Heading>Create Rent Schedule</Heading>
          <Text className="mt-2">
            Set up automated recurring rent invoices for a property unit
          </Text>
        </div>

        {loading ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <Text>Loading properties...</Text>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
            <Heading level={3}>No Properties Found</Heading>
            <Text className="mt-2 text-zinc-500">
              You need to add properties before creating rent schedules
            </Text>
            <Button href="/property-management/properties/create" className="mt-4" color="blue">
              Add Property
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Heading level={3} className="mb-4">Property & Unit</Heading>

              <div className="space-y-4">
                <Field>
                  <Label>Property *</Label>
                  <Select
                    value={selectedProperty}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    required
                  >
                    <option value="">Select a property...</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.propertyName} - {property.city}
                      </option>
                    ))}
                  </Select>
                </Field>

                {units.length > 0 && (
                  <Field>
                    <Label>Unit *</Label>
                    <Select
                      value={selectedUnit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      required
                    >
                      <option value="">Select a unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber}
                          {unit.bedrooms && ` - ${unit.bedrooms} Bed`}
                          {unit.monthlyRent && ` - KES ${parseFloat(unit.monthlyRent).toLocaleString()}/mo`}
                        </option>
                      ))}
                    </Select>
                    <Text className="mt-1 text-xs text-zinc-500">
                      Rent amount will be auto-filled from unit data if available
                    </Text>
                  </Field>
                )}

                {selectedUnit && tenants.length === 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>No Tenant Assigned</strong>
                      <p className="mt-1">
                        This unit doesn't have a tenant assigned yet. You need to assign a tenant to this unit before creating a rent automation schedule.
                      </p>
                    </div>
                  </div>
                )}

                {tenants.length > 0 && (
                  <Field>
                    <Label>Tenant *</Label>
                    <Select
                      value={selectedTenant}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                      required
                    >
                      <option value="">Select a tenant...</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.firstName} {tenant.lastName}
                          {!tenant.personalAccountId && ' (No account)'}
                        </option>
                      ))}
                    </Select>
                    {linkingInProgress && (
                      <div className="mt-2 rounded-lg bg-blue-50 p-3 ring-1 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-900">
                        <Text className="text-xs text-blue-800 dark:text-blue-200">
                          🔄 Searching for matching personal account by email/phone...
                        </Text>
                      </div>
                    )}
                    {!linkingInProgress && linkingSuccess && (
                      <div className="mt-2 rounded-lg bg-green-50 p-3 ring-1 ring-green-200 dark:bg-green-950/20 dark:ring-green-900">
                        <Text className="text-xs text-green-800 dark:text-green-200">
                          ✅ Personal account automatically linked! Tenant can now receive automated invoices.
                        </Text>
                      </div>
                    )}
                    {!linkingInProgress && selectedTenant && (() => {
                      const tenant = tenants.find(t => t.id === selectedTenant);
                      if (tenant && !tenant.personalAccountId) {
                        return (
                          <div className="mt-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-950/20 dark:ring-amber-900">
                            <Text className="text-xs text-amber-800 dark:text-amber-200">
                              ⚠️ This tenant doesn't have a personal account yet. They need to register on the mobile app before automated billing can be set up.
                            </Text>
                          </div>
                        );
                      }
                      if (tenant && tenant.personalAccountId && !linkingSuccess) {
                        return (
                          <Text className="mt-1 text-xs text-green-600 dark:text-green-400">
                            ✓ Tenant has a personal account
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </Field>
                )}
              </div>
            </div>

            {/* Schedule Details */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Heading level={3} className="mb-4">Schedule Details</Heading>

              <div className="space-y-4">
                <Field>
                  <Label>Schedule Name *</Label>
                  <Input
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="e.g., Sunset Apartments - Unit 1A Rent"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Monthly Rent Amount (KES) *</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50000"
                      min="0"
                      step="0.01"
                      required
                    />
                    <Text className="mt-1 text-xs text-zinc-500">
                      Auto-filled from unit. Can be overridden for special rates.
                    </Text>
                  </Field>

                  <Field>
                    <Label>Frequency *</Label>
                    <Select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      required
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Invoice Day of Month *</Label>
                    <Input
                      type="number"
                      value={dueDay}
                      onChange={(e) => {
                        const day = parseInt(e.target.value);
                        setDueDay(day);
                        // Auto-update start date to next occurrence of this day
                        if (day >= 1 && day <= 28) {
                          setStartDate(calculateNextStartDate(day));
                        }
                      }}
                      min="1"
                      max="28"
                      required
                    />
                    <Text className="mt-1 text-xs text-zinc-500">
                      Start date will auto-update to next occurrence
                    </Text>
                  </Field>

                  <Field>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <Label>Description (Optional)</Label>
                  <textarea
                    className="min-w-0 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional notes about this rent schedule..."
                  />
                </Field>
              </div>
            </div>

            {/* Info Panel */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
              <Text className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Once created, the schedule will automatically generate
                invoices on the {dueDay}
                {dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'} of each{' '}
                {frequency.toLowerCase()} period. You can pause or modify the schedule at any time.
              </Text>
            </div>

            {/* Validation Status */}
            {(() => {
              const selectedTenantData = tenants.find(t => t.id === selectedTenant);
              const hasPersonalAccount = selectedTenantData?.personalAccountId;
              const missingFields = [];

              if (!selectedProperty) missingFields.push('Property selection');
              if (!selectedUnit) missingFields.push('Unit selection');
              if (!selectedTenant) missingFields.push('Tenant selection');
              if (selectedTenant && !hasPersonalAccount) missingFields.push('Tenant with personal account');
              if (!amount) missingFields.push('Monthly rent amount');
              if (!startDate) missingFields.push('Start date');

              if (missingFields.length === 0) return null;

              return (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Please complete the following required fields:</strong>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      {missingFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                color="white"
                onClick={() => router.push('/property-management/rent-automation')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !selectedProperty ||
                  !selectedUnit ||
                  !selectedTenant ||
                  !tenants.find(t => t.id === selectedTenant)?.personalAccountId ||
                  !amount ||
                  !startDate
                }
                color="blue"
              >
                {submitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ApplicationLayout>
  );
}
