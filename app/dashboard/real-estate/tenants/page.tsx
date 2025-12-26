'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/lib/hooks/useOfflineMutation';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import {
  getMyProperties,
  getUnitsByProperty,
  getAvailableUnits,
  getTenantsByProperty,
  registerTenant,
  updateTenantStatus,
} from '@/lib/real-estate-api';
import type {
  Property,
  Unit,
  Tenant,
  RegisterTenantInput,
  TenantStatus,
  ApprovalMethod,
} from '@/types/real-estate';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { InvitationDialog } from '@/app/components/InvitationDialog';
import { toast } from 'sonner';
import { PlusIcon, UserGroupIcon, KeyIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/20/solid';

export default function TenantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('property') || '');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
  const [tenantToInvite, setTenantToInvite] = useState<Tenant | null>(null);

  // Form state
  const [formData, setFormData] = useState<RegisterTenantInput>({
    propertyId: '',
    unitId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    moveInDate: new Date().toISOString().split('T')[0],
    requireApprovalForVisitors: true,
    allowPreRegistration: true,
    otpDeliveryMethod: 'otp_sms',
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

  // Fetch available units for the selected property (for registration form)
  const { data: availableUnits } = useQuery({
    queryKey: ['available-units', formData.propertyId],
    queryFn: () => getAvailableUnits(formData.propertyId),
    enabled: !!formData.propertyId && isRegisterDialogOpen,
  });

  // Fetch tenants for selected property
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', selectedPropertyId],
    queryFn: () => getTenantsByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  // Register tenant mutation (offline-aware)
  const registerMutation = useOfflineMutation(
    registerTenant,
    {
      module: 'real-estate',
      operation: 'registerTenant',
      priority: 'high', // High priority - critical business operation
      invalidateKeys: ['tenants', 'units'],
      successMessage: (data) => `Tenant ${data.firstName} ${data.lastName} registered successfully`,
      onSuccess: () => {
        setIsRegisterDialogOpen(false);
        resetForm();
      },
    }
  );

  // Update tenant status mutation (offline-aware)
  const updateStatusMutation = useOfflineMutation(
    ({ tenantId, tenantStatus, moveOutDate }: { tenantId: string; tenantStatus: TenantStatus; moveOutDate?: string }) =>
      updateTenantStatus(tenantId, tenantStatus),
    {
      module: 'real-estate',
      operation: 'updateTenantStatus',
      priority: 'normal', // Normal priority - standard update operation
      invalidateKeys: ['tenants', 'units'],
      successMessage: 'Tenant status updated successfully',
      onSuccess: () => {
        setIsStatusDialogOpen(false);
        setSelectedTenant(null);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      propertyId: selectedPropertyId,
      unitId: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      nationalId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      moveInDate: new Date().toISOString().split('T')[0],
      requireApprovalForVisitors: true,
      allowPreRegistration: true,
      otpDeliveryMethod: 'otp_sms',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitId) {
      toast.error('Please select a unit');
      return;
    }
    registerMutation.mutate(formData);
  };

  const handleStatusUpdate = (newStatus: TenantStatus) => {
    if (!selectedTenant) return;
    const moveOutDate = newStatus === 'terminated' || newStatus === 'inactive'
      ? new Date().toISOString().split('T')[0]
      : undefined;
    updateStatusMutation.mutate({ tenantId: selectedTenant.id, tenantStatus: newStatus, moveOutDate });
  };

  const getTenantStatusBadge = (status: TenantStatus) => {
    const badges = {
      active: { color: 'lime' as const, label: 'Active' },
      inactive: { color: 'zinc' as const, label: 'Inactive' },
      suspended: { color: 'amber' as const, label: 'Suspended' },
      terminated: { color: 'red' as const, label: 'Terminated' },
      pending_move_in: { color: 'blue' as const, label: 'Pending Move-In' },
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
            <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
            <p className="mt-1 text-sm text-gray-500">Register and manage tenants across all properties</p>
          </div>
          {selectedPropertyId && (
            <Button onClick={() => setIsRegisterDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Register Tenant
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
              </div>
            )}
          </div>
        </div>

        {/* Tenants List */}
        {selectedPropertyId && (
          <>
            {tenantsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading tenants...</div>
              </div>
            ) : !tenants || tenants.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants yet</h3>
                <p className="text-gray-500 mb-4">Register your first tenant for this property</p>
                <Button onClick={() => setIsRegisterDialogOpen(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Register First Tenant
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Tenant Name</TableHeader>
                      <TableHeader>Contact</TableHeader>
                      <TableHeader>Unit</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>App Status</TableHeader>
                      <TableHeader>Move-In Date</TableHeader>
                      <TableHeader>Visitor Settings</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {tenant.firstName} {tenant.lastName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{tenant.phoneNumber}</div>
                            {tenant.email && <div className="text-gray-500">{tenant.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            plain
                            onClick={() => router.push(`/dashboard/real-estate/units?property=${selectedPropertyId}`)}
                          >
                            View Unit
                          </Button>
                        </TableCell>
                        <TableCell>{getTenantStatusBadge(tenant.tenantStatus)}</TableCell>
                        <TableCell>
                          {tenant.personalAccountId ? (
                            <Badge color="lime" className="flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3" />
                              Has App
                            </Badge>
                          ) : (
                            <Badge color="zinc">No App Account</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(tenant.moveInDate).toLocaleDateString()}
                          </div>
                          {tenant.moveOutDate && (
                            <div className="text-xs text-gray-500">
                              Out: {new Date(tenant.moveOutDate).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {tenant.requireApprovalForVisitors && (
                              <Badge color="blue" className="text-xs">Requires Approval</Badge>
                            )}
                            {tenant.allowPreRegistration && (
                              <Badge color="green" className="text-xs">Pre-Registration OK</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!tenant.personalAccountId && (
                              <Button
                                color="indigo"
                                onClick={() => {
                                  setTenantToInvite(tenant);
                                  setIsInvitationDialogOpen(true);
                                }}
                              >
                                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                                Invite to App
                              </Button>
                            )}
                            <Button
                              outline
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              Change Status
                            </Button>
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
            <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
            <p className="text-gray-500">Choose a property to view and manage its tenants</p>
          </div>
        )}

        {/* Register Tenant Dialog */}
        <Dialog open={isRegisterDialogOpen} onClose={() => setIsRegisterDialogOpen(false)} size="2xl">
          <DialogTitle>Register New Tenant</DialogTitle>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Property Selection */}
              <Field>
                <Label>Property *</Label>
                <Select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
                  required
                >
                  <option value="">Select property...</option>
                  {properties?.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.propertyName} ({property.propertyCode})
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Unit Selection */}
              {formData.propertyId && (
                <Field>
                  <Label>Unit *</Label>
                  <Select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    required
                  >
                    <option value="">Select available unit...</option>
                    {availableUnits?.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {unit.unitType} {unit.monthlyRent && `(KES ${parseFloat(unit.monthlyRent).toLocaleString()})`}
                      </option>
                    ))}
                  </Select>
                  {availableUnits?.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">No available units in this property</p>
                  )}
                </Field>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </Field>

                <Field>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    placeholder="+254..."
                  />
                </Field>

                <Field>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tenant@example.com"
                  />
                </Field>
              </div>

              <Field>
                <Label>National ID / Passport</Label>
                <Input
                  value={formData.nationalId || ''}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="ID or passport number"
                />
              </Field>

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Emergency Contact Name</Label>
                    <Input
                      value={formData.emergencyContactName || ''}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    />
                  </Field>

                  <Field>
                    <Label>Emergency Contact Phone</Label>
                    <Input
                      value={formData.emergencyContactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      placeholder="+254..."
                    />
                  </Field>
                </div>
              </div>

              {/* Move-In Date */}
              <Field>
                <Label>Move-In Date *</Label>
                <Input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  required
                />
              </Field>

              {/* Visitor Settings */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Visitor Management Settings</h4>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requireApprovalForVisitors}
                      onChange={(e) =>
                        setFormData({ ...formData, requireApprovalForVisitors: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Require tenant approval for all visitors</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowPreRegistration}
                      onChange={(e) => setFormData({ ...formData, allowPreRegistration: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow visitor pre-registration</span>
                  </label>
                </div>

                <Field className="mt-4">
                  <Label>OTP Delivery Method</Label>
                  <Select
                    value={formData.otpDeliveryMethod || 'otp_sms'}
                    onChange={(e) =>
                      setFormData({ ...formData, otpDeliveryMethod: e.target.value as ApprovalMethod })
                    }
                  >
                    <option value="otp_sms">SMS</option>
                    <option value="otp_email">Email</option>
                    <option value="push_notification">Push Notification</option>
                    <option value="voice_call">Voice Call</option>
                    <option value="whatsapp">WhatsApp</option>
                  </Select>
                </Field>
              </div>
            </form>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registering...' : 'Register Tenant'}
            </Button>
          </DialogActions>
        </Dialog>

{/* Update Status Dialog */}
        <Dialog open={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)}>
          <DialogTitle>Update Tenant Status</DialogTitle>
          <DialogBody>
            <p className="text-sm text-gray-600 mb-4">
              Change the status of tenant <strong>{selectedTenant?.firstName} {selectedTenant?.lastName}</strong>
            </p>

            {/* Status Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Status Guide
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong className="text-blue-700">Pending Move-In:</strong> Tenant has signed lease but hasn't moved in yet. Unit is reserved.
                </div>
                <div>
                  <strong className="text-green-700">Active:</strong> Tenant has moved in and is currently occupying the unit. Rent charges apply.
                </div>
                <div>
                  <strong className="text-amber-700">Suspended:</strong> Temporary suspension (e.g., non-payment). Can be reactivated. Unit stays occupied.
                </div>
                <div>
                  <strong className="text-gray-700">Inactive:</strong> Not currently active (e.g., extended leave). Unit still assigned.
                </div>
                <div>
                  <strong className="text-red-700">Terminated:</strong> Tenancy ended. Tenant moved out. Unit becomes available for new tenant.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <Button
                  color="blue"
                  className="w-full mb-1"
                  onClick={() => handleStatusUpdate('pending_move_in')}
                  disabled={selectedTenant?.tenantStatus === 'pending_move_in'}
                >
                  Set to Pending Move-In
                </Button>
                <p className="text-xs text-gray-600">Use when tenant has signed lease but hasn't moved in yet</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <Button
                  color="lime"
                  className="w-full mb-1"
                  onClick={() => handleStatusUpdate('active')}
                  disabled={selectedTenant?.tenantStatus === 'active'}
                >
                  Mark as Active
                </Button>
                <p className="text-xs text-gray-600">Tenant has moved in and is actively occupying the unit</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <Button
                  color="amber"
                  className="w-full mb-1"
                  onClick={() => handleStatusUpdate('suspended')}
                  disabled={selectedTenant?.tenantStatus === 'suspended'}
                >
                  Suspend Tenant
                </Button>
                <p className="text-xs text-gray-600">Temporary suspension for violations or non-payment</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <Button
                  color="zinc"
                  className="w-full mb-1"
                  onClick={() => handleStatusUpdate('inactive')}
                  disabled={selectedTenant?.tenantStatus === 'inactive'}
                >
                  Mark as Inactive
                </Button>
                <p className="text-xs text-gray-600">For extended leaves or temporary absences</p>
              </div>

              <div className="border border-red-200 rounded-lg p-3 hover:bg-red-50">
                <Button
                  color="red"
                  className="w-full mb-1"
                  onClick={() => handleStatusUpdate('terminated')}
                  disabled={selectedTenant?.tenantStatus === 'terminated'}
                >
                  Terminate Tenancy
                </Button>
                <p className="text-xs text-red-600">Permanently end tenancy. Unit will become available.</p>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invitation Dialog */}
        {tenantToInvite && (
          <InvitationDialog
            isOpen={isInvitationDialogOpen}
            onClose={() => {
              setIsInvitationDialogOpen(false);
              setTenantToInvite(null);
            }}
            organizationType="business"
            organizationId={userInfo.businessId}
            inviteeType="tenant"
            inviteeId={tenantToInvite.id}
            inviteeTableName="tenants"
            inviteeName={`${tenantToInvite.firstName} ${tenantToInvite.lastName}`}
            inviteeEmail={tenantToInvite.email}
            inviteePhone={tenantToInvite.phoneNumber}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['tenants', selectedPropertyId] });
            }}
          />
        )}
      </div>
    </ApplicationLayout>
  );
}
