'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/lib/hooks/useOfflineMutation';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import {
  getMyProperties,
  getParkingSpaces,
  getPropertyStatistics,
  createParkingSpace,
  assignParkingSpace,
  releaseParkingSpace,
} from '@/lib/real-estate-api';
import type {
  Property,
  ParkingSpace,
  CreateParkingSpaceInput,
  AssignParkingSpaceInput,
  ParkingSpaceType,
  ParkingSpaceStatus,
} from '@/types/real-estate';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { toast } from 'sonner';
import { PlusIcon, TruckIcon } from '@heroicons/react/20/solid';

export default function ParkingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateParkingSpaceInput>({
    propertyId: '',
    spaceNumber: '',
    parkingType: 'open',
    floorLevel: '',
    section: '',
  });

  const [assignFormData, setAssignFormData] = useState<AssignParkingSpaceInput>({
    parkingSpaceId: '',
    unitId: '',
    tenantId: '',
    visitorLogId: '',
    vehicleRegistration: '',
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

    // Security staff or administrators can access
    const canAccess = isAdministrator(info.userRole) ||
                      info.staffRole === 'Security' ||
                      info.department === 'Security';

    if (!canAccess) {
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

  // Fetch parking spaces
  const { data: parkingSpaces, isLoading: spacesLoading } = useQuery({
    queryKey: ['parking-spaces', selectedPropertyId],
    queryFn: () => getParkingSpaces(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  // Fetch property statistics
  const { data: stats } = useQuery({
    queryKey: ['property-stats', selectedPropertyId],
    queryFn: () => getPropertyStatistics(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  // Create parking space mutation (offline-aware)
  const createMutation = useOfflineMutation(
    createParkingSpace,
    {
      module: 'real-estate',
      operation: 'createParkingSpace',
      priority: 'high', // High priority - security/access control
      invalidateKeys: ['parking-spaces', 'property-stats'],
      successMessage: (data) => `Parking space ${data.spaceNumber} created successfully`,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetCreateForm();
      },
    }
  );

  // Assign parking space mutation (offline-aware)
  const assignMutation = useOfflineMutation(
    assignParkingSpace,
    {
      module: 'real-estate',
      operation: 'assignParkingSpace',
      priority: 'high', // High priority - security/access control
      invalidateKeys: ['parking-spaces', 'property-stats'],
      successMessage: 'Parking space assigned successfully',
      onSuccess: () => {
        setIsAssignDialogOpen(false);
        setSelectedSpace(null);
        resetAssignForm();
      },
    }
  );

  // Release parking space mutation (offline-aware)
  const releaseMutation = useOfflineMutation(
    releaseParkingSpace,
    {
      module: 'real-estate',
      operation: 'releaseParkingSpace',
      priority: 'high', // High priority - security/access control
      invalidateKeys: ['parking-spaces', 'property-stats'],
      successMessage: 'Parking space released successfully',
    }
  );

  const resetCreateForm = () => {
    setCreateFormData({
      propertyId: selectedPropertyId,
      spaceNumber: '',
      parkingType: 'open',
      floorLevel: '',
      section: '',
    });
  };

  const resetAssignForm = () => {
    setAssignFormData({
      parkingSpaceId: '',
      unitId: '',
      tenantId: '',
      visitorLogId: '',
      vehicleRegistration: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error('Please select a property first');
      return;
    }
    createMutation.mutate({ ...createFormData, propertyId: selectedPropertyId });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;
    assignMutation.mutate({
      ...assignFormData,
      parkingSpaceId: selectedSpace.id,
    });
  };

  const getTypeBadge = (type: ParkingSpaceType) => {
    const badges = {
      covered: { color: 'blue' as const, label: 'Covered' },
      open: { color: 'green' as const, label: 'Open' },
      reserved: { color: 'purple' as const, label: 'Reserved' },
      visitor: { color: 'cyan' as const, label: 'Visitor' },
      disabled: { color: 'amber' as const, label: 'Disabled' },
      vip: { color: 'red' as const, label: 'VIP' },
      motorcycle: { color: 'pink' as const, label: 'Motorcycle' },
      loading_bay: { color: 'zinc' as const, label: 'Loading Bay' },
    };
    const badge = badges[type];
    return <Badge color={badge.color}>{badge.label}</Badge>;
  };

  const getStatusBadge = (status: ParkingSpaceStatus) => {
    const badges = {
      available: { color: 'lime' as const, label: 'Available' },
      occupied: { color: 'red' as const, label: 'Occupied' },
      reserved: { color: 'amber' as const, label: 'Reserved' },
      under_maintenance: { color: 'zinc' as const, label: 'Maintenance' },
    };
    const badge = badges[status];
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
  const isAdmin = isAdministrator(userInfo.userRole);

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => {
        localStorage.clear();
        router.push('/login');
      }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdmin}
    >
      <div className="p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parking Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage parking spaces and assignments</p>
          </div>
          {selectedPropertyId && isAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Parking Space
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
              <Badge color="blue">{selectedProperty.propertyType.replace(/_/g, ' ')}</Badge>
            )}
          </div>

          {/* Parking Statistics */}
          {stats && selectedPropertyId && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Spaces</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalParkingSpaces}</div>
              </div>
              <div className="bg-white border border-lime-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">Available</div>
                <div className="text-2xl font-bold text-lime-600">{stats.availableParkingSpaces}</div>
              </div>
              <div className="bg-white border border-red-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">Occupied</div>
                <div className="text-2xl font-bold text-red-600">{stats.occupiedParkingSpaces}</div>
              </div>
            </div>
          )}
        </div>

        {/* Parking Spaces List */}
        {selectedPropertyId && (
          <>
            {spacesLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading parking spaces...</div>
              </div>
            ) : !parkingSpaces || parkingSpaces.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No parking spaces yet</h3>
                <p className="text-gray-500 mb-4">Add parking spaces to this property</p>
                {isAdmin && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add First Space
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Space Number</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Location</TableHeader>
                      <TableHeader>Assignment</TableHeader>
                      <TableHeader>Vehicle</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parkingSpaces.map((space) => (
                      <TableRow key={space.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{space.spaceNumber}</div>
                        </TableCell>
                        <TableCell>{getTypeBadge(space.parkingType)}</TableCell>
                        <TableCell>{getStatusBadge(space.parkingStatus)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {space.floorLevel && <div>Floor: {space.floorLevel}</div>}
                            {space.section && <div>Section: {space.section}</div>}
                            {!space.floorLevel && !space.section && <span>-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {space.unitId ? (
                            <div className="text-sm">
                              <Badge color="blue">Unit: {space.unitId}</Badge>
                            </div>
                          ) : space.tenantId ? (
                            <div className="text-sm">
                              <Badge color="green">Tenant: {space.tenantId}</Badge>
                            </div>
                          ) : space.currentVisitorLogId ? (
                            <div className="text-sm">
                              <Badge color="purple">Visitor</Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {space.currentVehicleRegistration ? (
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {space.currentVehicleRegistration}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {space.parkingStatus === 'available' ? (
                              <Button
                                outline
                                color="blue"
                                onClick={() => {
                                  setSelectedSpace(space);
                                  setIsAssignDialogOpen(true);
                                }}
                              >
                                Assign
                              </Button>
                            ) : (
                              <Button
                                outline
                                color="red"
                                onClick={() => releaseMutation.mutate(space.id)}
                                disabled={releaseMutation.isPending}
                              >
                                Release
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
            <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
            <p className="text-gray-500">Choose a property to view and manage parking spaces</p>
          </div>
        )}

        {/* Create Parking Space Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
          <DialogTitle>Add Parking Space</DialogTitle>
          <DialogBody>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Field>
                <Label>Space Number *</Label>
                <Input
                  value={createFormData.spaceNumber}
                  onChange={(e) => setCreateFormData({ ...createFormData, spaceNumber: e.target.value })}
                  required
                  placeholder="e.g., P-001, A12, G-Level-5"
                />
              </Field>

              <Field>
                <Label>Parking Type *</Label>
                <Select
                  value={createFormData.parkingType}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, parkingType: e.target.value as ParkingSpaceType })
                  }
                  required
                >
                  <option value="open">Open</option>
                  <option value="covered">Covered</option>
                  <option value="reserved">Reserved</option>
                  <option value="visitor">Visitor</option>
                  <option value="disabled">Disabled</option>
                  <option value="vip">VIP</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="loading_bay">Loading Bay</option>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Floor Level</Label>
                  <Input
                    value={createFormData.floorLevel || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, floorLevel: e.target.value })}
                    placeholder="e.g., G, B1, Floor 2"
                  />
                </Field>

                <Field>
                  <Label>Section</Label>
                  <Input
                    value={createFormData.section || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, section: e.target.value })}
                    placeholder="e.g., North Wing, Block A"
                  />
                </Field>
              </div>
            </form>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Space'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Parking Space Dialog */}
        <Dialog open={isAssignDialogOpen} onClose={() => setIsAssignDialogOpen(false)}>
          <DialogTitle>Assign Parking Space</DialogTitle>
          <DialogBody>
            <p className="text-sm text-gray-600 mb-4">
              Assign parking space <strong>{selectedSpace?.spaceNumber}</strong>
            </p>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <Field>
                <Label>Assignment Type *</Label>
                <Select required>
                  <option value="">Select assignment type...</option>
                  <option value="unit">Unit (Permanent)</option>
                  <option value="tenant">Tenant (Temporary)</option>
                  <option value="visitor">Visitor</option>
                </Select>
              </Field>

              <Field>
                <Label>Vehicle Registration *</Label>
                <Input
                  value={assignFormData.vehicleRegistration || ''}
                  onChange={(e) => setAssignFormData({ ...assignFormData, vehicleRegistration: e.target.value })}
                  required
                  placeholder="e.g., KAA 123B"
                />
              </Field>

              <p className="text-xs text-gray-500">
                Note: For unit/tenant assignments, you'll need to provide the unit ID or tenant ID. This is a simplified version.
              </p>
            </form>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Space'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
