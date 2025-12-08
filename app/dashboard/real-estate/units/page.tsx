'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/lib/hooks/useOfflineMutation';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { getMyProperties, getUnitsByProperty, createUnit, updateUnitStatus } from '@/lib/real-estate-api';
import type { Property, Unit, CreateUnitInput, UnitStatus, UnitType } from '@/types/real-estate';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { toast } from 'sonner';
import { PlusIcon, SquaresPlusIcon, HomeIcon } from '@heroicons/react/20/solid';

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('property') || '');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateUnitInput>({
    propertyId: '',
    unitNumber: '',
    unitType: 'apartment',
    floorNumber: 1,
    sizeSqm: '',
    bedrooms: 0,
    bathrooms: 0,
    monthlyRent: '',
    securityDeposit: '',
    allocatedParkingSpaces: 0,
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
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: getMyProperties,
    enabled: !!userInfo,
  });

  // Fetch units for selected property
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', selectedPropertyId],
    queryFn: () => getUnitsByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  // Create unit mutation (offline-aware)
  const createMutation = useOfflineMutation(
    createUnit,
    {
      module: 'real-estate',
      operation: 'createUnit',
      priority: 'high', // High priority - critical business operation
      invalidateKeys: ['units', 'properties'],
      successMessage: (data) => `Unit ${data.unitNumber} created successfully`,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      },
    }
  );

  // Update unit status mutation (offline-aware)
  const updateStatusMutation = useOfflineMutation(
    ({ unitId, unitStatus }: { unitId: string; unitStatus: UnitStatus }) =>
      updateUnitStatus(unitId, unitStatus),
    {
      module: 'real-estate',
      operation: 'updateUnitStatus',
      priority: 'normal', // Normal priority - standard update operation
      invalidateKeys: ['units', 'properties'],
      successMessage: 'Unit status updated successfully',
      onSuccess: () => {
        setIsStatusDialogOpen(false);
        setSelectedUnit(null);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      propertyId: selectedPropertyId,
      unitNumber: '',
      unitType: 'apartment',
      floorNumber: 1,
      sizeSqm: '',
      bedrooms: 0,
      bathrooms: 0,
      monthlyRent: '',
      securityDeposit: '',
      allocatedParkingSpaces: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error('Please select a property first');
      return;
    }
    createMutation.mutate({ ...formData, propertyId: selectedPropertyId });
  };

  const handleStatusUpdate = (newStatus: UnitStatus) => {
    if (!selectedUnit) return;
    updateStatusMutation.mutate({ unitId: selectedUnit.id, unitStatus: newStatus });
  };

  const getUnitStatusBadge = (status: UnitStatus) => {
    const badges = {
      available: { color: 'lime' as const, label: 'Available' },
      occupied: { color: 'blue' as const, label: 'Occupied' },
      under_maintenance: { color: 'amber' as const, label: 'Maintenance' },
      reserved: { color: 'purple' as const, label: 'Reserved' },
    };
    const badge = badges[status];
    return <Badge color={badge.color}>{badge.label}</Badge>;
  };

  const getUnitTypeBadge = (type: UnitType) => {
    const badges = {
      apartment: { color: 'blue' as const, label: 'Apartment' },
      townhouse: { color: 'green' as const, label: 'Townhouse' },
      villa: { color: 'purple' as const, label: 'Villa' },
      office: { color: 'cyan' as const, label: 'Office' },
      shop: { color: 'pink' as const, label: 'Shop' },
      warehouse: { color: 'zinc' as const, label: 'Warehouse' },
      storage: { color: 'orange' as const, label: 'Storage' },
      penthouse: { color: 'red' as const, label: 'Penthouse' },
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

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);

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
            <h1 className="text-2xl font-bold text-gray-900">Unit Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage units across all properties</p>
          </div>
          {selectedPropertyId && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          )}
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-96"
            >
              <option value="">Select a property...</option>
              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.propertyName} ({property.propertyCode}) - {property.city}
                </option>
              ))}
            </Select>

            {selectedProperty && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge color="blue">{selectedProperty.propertyType.replace(/_/g, ' ')}</Badge>
                <span>Total Units: {selectedProperty.totalUnits}</span>
              </div>
            )}
          </div>
        </div>

        {/* Units List */}
        {selectedPropertyId && (
          <>
            {unitsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading units...</div>
              </div>
            ) : !units || units.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No units yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding units to this property</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add First Unit
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Unit Number</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Floor</TableHeader>
                      <TableHeader>Size</TableHeader>
                      <TableHeader>Beds/Baths</TableHeader>
                      <TableHeader>Monthly Rent</TableHeader>
                      <TableHeader>Parking</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{unit.unitNumber}</div>
                        </TableCell>
                        <TableCell>{getUnitTypeBadge(unit.unitType)}</TableCell>
                        <TableCell>{getUnitStatusBadge(unit.unitStatus)}</TableCell>
                        <TableCell>
                          {unit.floorNumber ? `Floor ${unit.floorNumber}` : '-'}
                        </TableCell>
                        <TableCell>
                          {unit.sizeSqm ? `${unit.sizeSqm} m²` : '-'}
                        </TableCell>
                        <TableCell>
                          {unit.bedrooms || unit.bathrooms ? (
                            <span>
                              {unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''} / {unit.bathrooms} bath
                              {unit.bathrooms !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {unit.monthlyRent ? (
                            <span className="font-medium">KES {parseFloat(unit.monthlyRent).toLocaleString()}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {unit.allocatedParkingSpaces > 0 ? (
                            <Badge color="green">{unit.allocatedParkingSpaces} space(s)</Badge>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              outline
                              onClick={() => {
                                setSelectedUnit(unit);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              Change Status
                            </Button>
                            {unit.unitStatus === 'occupied' && (
                              <Button
                                outline
                                onClick={() => router.push(`/dashboard/real-estate/tenants?unit=${unit.id}`)}
                              >
                                View Tenant
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <SquaresPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
            <p className="text-gray-500">Choose a property to view and manage its units</p>
          </div>
        )}

        {/* Create Unit Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <Label>Unit Number *</Label>
                <Input
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  required
                  placeholder="e.g., A101, 2B, Office-305"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Unit Type *</Label>
                  <Select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value as UnitType })}
                    required
                  >
                    <option value="apartment">Apartment</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="villa">Villa</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="office">Office</option>
                    <option value="shop">Shop</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="storage">Storage</option>
                  </Select>
                </Field>

                <Field>
                  <Label>Floor Number</Label>
                  <Input
                    type="number"
                    value={formData.floorNumber || ''}
                    onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) || undefined })}
                    min="0"
                    placeholder="Floor number"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <Label>Size (m²)</Label>
                  <Input
                    value={formData.sizeSqm || ''}
                    onChange={(e) => setFormData({ ...formData, sizeSqm: e.target.value })}
                    placeholder="e.g., 85.5"
                  />
                </Field>

                <Field>
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={formData.bedrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </Field>

                <Field>
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    value={formData.bathrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Monthly Rent (KES)</Label>
                  <Input
                    value={formData.monthlyRent || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    placeholder="e.g., 25000"
                  />
                </Field>

                <Field>
                  <Label>Security Deposit (KES)</Label>
                  <Input
                    value={formData.securityDeposit || ''}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </Field>
              </div>

              <Field>
                <Label>Allocated Parking Spaces</Label>
                <Input
                  type="number"
                  value={formData.allocatedParkingSpaces || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, allocatedParkingSpaces: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  placeholder="Number of parking spaces"
                />
              </Field>
            </form>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Unit'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)}>
          <DialogTitle>Update Unit Status</DialogTitle>
          <DialogBody>
            <p className="text-sm text-gray-600 mb-4">
              Change the status of unit <strong>{selectedUnit?.unitNumber}</strong>
            </p>
            <div className="space-y-2">
              <Button
                color="lime"
                className="w-full"
                onClick={() => handleStatusUpdate('available')}
                disabled={selectedUnit?.unitStatus === 'available'}
              >
                Mark as Available
              </Button>
              <Button
                color="blue"
                className="w-full"
                onClick={() => handleStatusUpdate('occupied')}
                disabled={selectedUnit?.unitStatus === 'occupied'}
              >
                Mark as Occupied
              </Button>
              <Button
                color="amber"
                className="w-full"
                onClick={() => handleStatusUpdate('under_maintenance')}
                disabled={selectedUnit?.unitStatus === 'under_maintenance'}
              >
                Under Maintenance
              </Button>
              <Button
                color="purple"
                className="w-full"
                onClick={() => handleStatusUpdate('reserved')}
                disabled={selectedUnit?.unitStatus === 'reserved'}
              >
                Mark as Reserved
              </Button>
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
