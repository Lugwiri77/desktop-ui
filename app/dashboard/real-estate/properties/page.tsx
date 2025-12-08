'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/lib/hooks/useOfflineMutation';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { getMyProperties, createProperty, getPropertyStatistics } from '@/lib/real-estate-api';
import { CREATE_PROPERTY } from '@/lib/real-estate-api';
import type { Property, CreatePropertyInput, PropertyType, PropertyStatistics } from '@/types/real-estate';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { toast } from 'sonner';
import { PlusIcon, BuildingOffice2Icon, MapPinIcon } from '@heroicons/react/20/solid';

export default function PropertiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePropertyInput>({
    propertyName: '',
    propertyType: 'residential_apartment',
    propertyCode: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'Kenya',
    totalFloors: 1,
    hasElevator: false,
    hasParking: true,
    totalParkingSpaces: 0,
    requireVisitorApproval: true,
    allowPreRegistration: true,
    otpExpiryMinutes: 15,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info || !info.realEstateBusinessSubcategory) {
      router.push('/dashboard');
      return;
    }

    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard/real-estate/approvals');
      return;
    }

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  // Fetch properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getMyProperties,
    enabled: !!userInfo,
  });

  // Fetch statistics for selected property
  const { data: stats } = useQuery({
    queryKey: ['property-stats', selectedPropertyId],
    queryFn: () => getPropertyStatistics(selectedPropertyId!),
    enabled: !!selectedPropertyId,
  });

  // Create property mutation (offline-aware)
  const createMutation = useOfflineMutation(
    createProperty,
    {
      module: 'real-estate',
      operation: 'createProperty',
      priority: 'high', // High priority - critical business operation
      invalidateKeys: ['properties'],
      successMessage: (data) => `Property "${data.propertyName}" created successfully`,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      },
    }
  );

  const resetForm = () => {
    setFormData({
      propertyName: '',
      propertyType: 'residential_apartment',
      propertyCode: '',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      country: 'Kenya',
      totalFloors: 1,
      hasElevator: false,
      hasParking: true,
      totalParkingSpaces: 0,
      requireVisitorApproval: true,
      allowPreRegistration: true,
      otpExpiryMinutes: 15,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getPropertyTypeBadge = (type: PropertyType) => {
    const badges = {
      residential_apartment: { color: 'blue' as const, label: 'Apartment' },
      residential_gated_community: { color: 'green' as const, label: 'Gated Community' },
      residential_townhouse: { color: 'cyan' as const, label: 'Townhouse' },
      commercial_office: { color: 'purple' as const, label: 'Office' },
      commercial_retail: { color: 'pink' as const, label: 'Retail' },
      commercial_mixed_use: { color: 'orange' as const, label: 'Mixed Use' },
      industrial_warehouse: { color: 'zinc' as const, label: 'Warehouse' },
      industrial_factory: { color: 'red' as const, label: 'Factory' },
    };
    const badge = badges[type];
    return <Badge color={badge.color}>{badge.label}</Badge>;
  };

  if (loading || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => {
        localStorage.clear();
        router.push('/login');
      }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdministrator(userInfo.userRole)}
    >
      <div className="p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage residential and commercial properties</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Properties List */}
        {propertiesLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading properties...</div>
          </div>
        ) : !properties || properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first property</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Property Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Units</TableHeader>
                  <TableHeader>Floors</TableHeader>
                  <TableHeader>Parking</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{property.propertyName}</div>
                      {property.managerName && (
                        <div className="text-xs text-gray-500">Manager: {property.managerName}</div>
                      )}
                    </TableCell>
                    <TableCell>{getPropertyTypeBadge(property.propertyType)}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{property.propertyCode}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mr-1 mt-0.5" />
                        <div>
                          <div className="text-sm">{property.city}</div>
                          {property.county && <div className="text-xs text-gray-500">{property.county}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{property.totalUnits}</span>
                    </TableCell>
                    <TableCell>
                      <span>{property.totalFloors}</span>
                      {property.hasElevator && (
                        <Badge color="green" className="ml-2 text-xs">Elevator</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.hasParking ? (
                        <span>{property.totalParkingSpaces} spaces</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        outline
                        onClick={() => router.push(`/dashboard/real-estate/units?property=${property.id}`)}
                      >
                        Manage Units
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Property Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <Label>Property Name *</Label>
                <Input
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  required
                  placeholder="e.g., Sunset Apartments"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                    required
                  >
                    <option value="residential_apartment">Residential - Apartment</option>
                    <option value="residential_gated_community">Residential - Gated Community</option>
                    <option value="residential_townhouse">Residential - Townhouse</option>
                    <option value="commercial_office">Commercial - Office</option>
                    <option value="commercial_retail">Commercial - Retail</option>
                    <option value="commercial_mixed_use">Commercial - Mixed Use</option>
                    <option value="industrial_warehouse">Industrial - Warehouse</option>
                    <option value="industrial_factory">Industrial - Factory</option>
                  </Select>
                </Field>

                <Field>
                  <Label>Property Code *</Label>
                  <Input
                    value={formData.propertyCode}
                    onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value })}
                    required
                    placeholder="e.g., SA-001"
                  />
                </Field>
              </div>

              <Field>
                <Label>Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  placeholder="Street address"
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </Field>

                <Field>
                  <Label>County</Label>
                  <Input
                    value={formData.county || ''}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  />
                </Field>

                <Field>
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.postalCode || ''}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Total Floors</Label>
                  <Input
                    type="number"
                    value={formData.totalFloors || ''}
                    onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </Field>

                <Field>
                  <Label>Parking Spaces</Label>
                  <Input
                    type="number"
                    value={formData.totalParkingSpaces || ''}
                    onChange={(e) => setFormData({ ...formData, totalParkingSpaces: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasElevator}
                    onChange={(e) => setFormData({ ...formData, hasElevator: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Elevator</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasParking}
                    onChange={(e) => setFormData({ ...formData, hasParking: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Parking</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requireVisitorApproval}
                    onChange={(e) => setFormData({ ...formData, requireVisitorApproval: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Require Tenant Approval for Visitors</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowPreRegistration}
                    onChange={(e) => setFormData({ ...formData, allowPreRegistration: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Allow Visitor Pre-Registration</span>
                </label>
              </div>
            </form>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Property'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
