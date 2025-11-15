'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '../components/application-layout';
import { Heading, Subheading } from '../components/heading';
import { Text } from '../components/text';
import { Button } from '../components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/table';
import { Badge } from '../components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../components/dialog';
import { Field, Label, Description } from '../components/fieldset';
import { Input } from '../components/input';
import { Textarea } from '../components/textarea';
import { Select } from '../components/select';
import { Checkbox, CheckboxField } from '../components/checkbox';
import { isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  canManageGates,
  isSecurityDepartmentManager,
  UserInfo,
} from '@/lib/roles';
import {
  getOrganizationGates,
  getOrganizationLocations,
  createLocation,
  createGate,
  updateLocation,
  updateGate,
  deleteLocation,
  deleteGate,
  type SecurityGate,
  type OrganizationLocation,
  type GateLocation as GateLocationType,
} from '@/lib/security-department-api';

type TabType = 'locations' | 'gates';

export default function LocationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('locations');
  const [isCreateLocationDialogOpen, setIsCreateLocationDialogOpen] = useState(false);
  const [isCreateGateDialogOpen, setIsCreateGateDialogOpen] = useState(false);
  const [isEditLocationDialogOpen, setIsEditLocationDialogOpen] = useState(false);
  const [isEditGateDialogOpen, setIsEditGateDialogOpen] = useState(false);
  const [isDeleteLocationDialogOpen, setIsDeleteLocationDialogOpen] = useState(false);
  const [isDeleteGateDialogOpen, setIsDeleteGateDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<OrganizationLocation | null>(null);
  const [selectedGate, setSelectedGate] = useState<SecurityGate | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Location form state
  const [locationForm, setLocationForm] = useState({
    locationCode: '',
    locationName: '',
    locationType: 'main_office',
    addressLine1: '',
    city: '',
    country: '',
    phoneNumber: '',
  });

  // Gate form state
  const [gateForm, setGateForm] = useState({
    locationId: '',
    gateCode: '',
    gateName: '',
    gateType: 'main_gate' as string,
    description: '',
    isMonitored: false,
  });

  // Get existing gates at selected location
  const getExistingGatesAtLocation = (locationId: string) => {
    if (!gates || !locationId) return [];
    return gates.filter(gate => gate.locationId === locationId);
  };

  // Check if a gate type already exists at the selected location
  const isGateTypeUnavailable = (gateType: string, locationId: string) => {
    if (!locationId) return false;
    const existingGates = getExistingGatesAtLocation(locationId);

    // These gate types can only have one per location
    const uniqueGateTypes = ['main_gate', 'vip_entrance', 'staff_entrance', 'parking_entrance'];

    if (uniqueGateTypes.includes(gateType)) {
      return existingGates.some(gate => gate.gateType.toLowerCase() === gateType);
    }

    return false;
  };

  // Get gate type restriction message
  const getGateTypeInfo = (gateType: string) => {
    const restrictions: Record<string, string> = {
      'main_gate': 'Only one main gate allowed per location - primary visitor entrance',
      'vip_entrance': 'Only one VIP entrance allowed per location - for executives and dignitaries',
      'staff_entrance': 'Only one staff entrance allowed per location - for employees',
      'parking_entrance': 'Only one parking entrance allowed per location - vehicle access',
      'side_gate': 'Multiple side gates allowed - for secondary access points',
      'back_entrance': 'Multiple back entrances allowed - for service/delivery access',
    };
    return restrictions[gateType] || '';
  };

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

    // Allow administrators and Security Department Managers to access this page
    // Admins can manage both locations and gates
    // Security Managers can only manage gates
    if (!isAdministrator(info.userRole) && !isSecurityDepartmentManager(info)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  // Fetch locations
  const { data: locations, isLoading: locationsLoading } = useQuery<OrganizationLocation[]>({
    queryKey: ['organizationLocations'],
    queryFn: getOrganizationLocations,
    enabled: !!userInfo,
  });

  // Fetch gates
  const { data: gates, isLoading: gatesLoading } = useQuery<SecurityGate[]>({
    queryKey: ['organizationGates'],
    queryFn: getOrganizationGates,
    enabled: !!userInfo,
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationLocations'] });
      setSuccess('Location created successfully');
      setIsCreateLocationDialogOpen(false);
      resetLocationForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create location');
      setTimeout(() => setError(''), 5000);
    },
  });

  // Create gate mutation
  const createGateMutation = useMutation({
    mutationFn: createGate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationGates'] });
      setSuccess('Gate created successfully');
      setIsCreateGateDialogOpen(false);
      resetGateForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(parseGateError(error.message || 'Failed to create gate'));
      setTimeout(() => setError(''), 6000);
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationLocations'] });
      setSuccess('Location updated successfully');
      setIsEditLocationDialogOpen(false);
      setSelectedLocation(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update location');
      setTimeout(() => setError(''), 5000);
    },
  });

  // Update gate mutation
  const updateGateMutation = useMutation({
    mutationFn: updateGate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationGates'] });
      setSuccess('Gate updated successfully');
      setIsEditGateDialogOpen(false);
      setSelectedGate(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(parseGateError(error.message || 'Failed to update gate'));
      setTimeout(() => setError(''), 6000);
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationLocations'] });
      setSuccess('Location deleted successfully');
      setIsDeleteLocationDialogOpen(false);
      setSelectedLocation(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete location');
      setTimeout(() => setError(''), 5000);
    },
  });

  // Delete gate mutation
  const deleteGateMutation = useMutation({
    mutationFn: deleteGate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationGates'] });
      setSuccess('Gate deleted successfully');
      setIsDeleteGateDialogOpen(false);
      setSelectedGate(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete gate');
      setTimeout(() => setError(''), 5000);
    },
  });

  // Parse gate error messages for better UX
  const parseGateError = (errorMessage: string): string => {
    if (errorMessage.includes('idx_institution_gates_one_main_gate_per_location') ||
        errorMessage.includes('idx_business_gates_one_main_gate_per_location')) {
      return 'Only one Main Gate is allowed per location. Please choose a different gate type.';
    } else if (errorMessage.includes('idx_institution_gates_one_vip_per_location') ||
               errorMessage.includes('idx_business_gates_one_vip_per_location')) {
      return 'Only one VIP Entrance is allowed per location. Please choose a different gate type.';
    } else if (errorMessage.includes('idx_institution_gates_one_staff_entrance_per_location') ||
               errorMessage.includes('idx_business_gates_one_staff_entrance_per_location')) {
      return 'Only one Staff Entrance is allowed per location. Please choose a different gate type.';
    } else if (errorMessage.includes('idx_institution_gates_one_parking_per_location') ||
               errorMessage.includes('idx_business_gates_one_parking_per_location')) {
      return 'Only one Parking Entrance is allowed per location. Please choose a different gate type.';
    } else if (errorMessage.includes('idx_institution_gates_unique_code_per_org') ||
               errorMessage.includes('idx_business_gates_unique_code_per_org')) {
      return 'This gate code is already in use. Please choose a unique gate code.';
    }
    return errorMessage;
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  const resetLocationForm = () => {
    setLocationForm({
      locationCode: '',
      locationName: '',
      locationType: 'main_office',
      addressLine1: '',
      city: '',
      country: '',
      phoneNumber: '',
    });
  };

  const resetGateForm = () => {
    setGateForm({
      locationId: '',
      gateCode: '',
      gateName: '',
      gateType: 'main_gate',
      description: '',
      isMonitored: false,
    });
  };

  const handleCreateLocation = () => {
    if (!locationForm.locationCode.trim()) {
      setError('Location code is required');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!locationForm.locationName.trim()) {
      setError('Location name is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    createLocationMutation.mutate({
      locationCode: locationForm.locationCode,
      locationName: locationForm.locationName,
      locationType: locationForm.locationType,
      addressLine1: locationForm.addressLine1 || undefined,
      city: locationForm.city || undefined,
      country: locationForm.country || undefined,
      phoneNumber: locationForm.phoneNumber || undefined,
    });
  };

  const handleCreateGate = () => {
    if (!gateForm.locationId) {
      setError('Please select a location');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!gateForm.gateCode.trim()) {
      setError('Gate code is required');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!gateForm.gateName.trim()) {
      setError('Gate name is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check for gate type constraints
    if (isGateTypeUnavailable(gateForm.gateType, gateForm.locationId)) {
      const locationName = getLocationName(gateForm.locationId);
      const gateTypeName = formatGateType(gateForm.gateType);
      setError(`A ${gateTypeName} already exists at ${locationName}. Only one ${gateTypeName} is allowed per location.`);
      setTimeout(() => setError(''), 6000);
      return;
    }

    createGateMutation.mutate({
      locationId: gateForm.locationId,
      gateCode: gateForm.gateCode,
      gateName: gateForm.gateName,
      gateType: gateForm.gateType.toUpperCase() as GateLocationType,
      description: gateForm.description || undefined,
      isMonitored: gateForm.isMonitored,
    });
  };

  const formatGateType = (type: string): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formatLocationType = (type: string): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const getLocationName = (locationId: string): string => {
    const location = locations?.find(loc => loc.id === locationId);
    return location ? location.locationName : 'Unknown';
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);
  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Heading>Organization Locations & Gates</Heading>
            <Text className="mt-2">Manage physical locations and security gates for your organization</Text>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('locations')}
              className={`${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition`}
            >
              Locations ({locations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('gates')}
              className={`${
                activeTab === 'gates'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition`}
            >
              Gates ({gates?.length || 0})
            </button>
          </nav>
        </div>

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            {/* Only administrators can create locations */}
            {isAdmin && (
              <div className="flex justify-end">
                <Button onClick={() => setIsCreateLocationDialogOpen(true)}>Create Location</Button>
              </div>
            )}

            {locationsLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-gray-600">Loading locations...</div>
              </div>
            ) : locations && locations.length > 0 ? (
              <div className="rounded-lg px-2.5 bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Code</TableHeader>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Address</TableHeader>
                      <TableHeader>City</TableHeader>
                      <TableHeader>Country</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-mono text-sm">{location.locationCode}</TableCell>
                        <TableCell className="font-medium">{location.locationName}</TableCell>
                        <TableCell>{formatLocationType(location.locationType)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={location.addressLine1 || ''}>
                            {location.addressLine1 || <span className="text-gray-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>{location.city || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell>{location.country || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell className="font-mono text-xs">{location.phoneNumber || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell>
                          {location.isActive ? (
                            <Badge color="green">Active</Badge>
                          ) : (
                            <Badge color="red">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Only administrators can edit/delete locations */}
                          {isAdmin ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setLocationForm({
                                    locationCode: location.locationCode,
                                    locationName: location.locationName,
                                    locationType: location.locationType,
                                    addressLine1: location.addressLine1 || '',
                                    city: location.city || '',
                                    country: location.country || '',
                                    phoneNumber: location.phoneNumber || '',
                                  });
                                  setIsEditLocationDialogOpen(true);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <span className="text-zinc-300 dark:text-zinc-600">|</span>
                              <button
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setIsDeleteLocationDialogOpen(true);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <Subheading className="mt-4">No locations found</Subheading>
                <Text className="mt-2">
                  {isAdmin
                    ? 'Create your first location to get started'
                    : 'Ask an administrator to create locations. You can manage gates once locations are created.'}
                </Text>
                {isAdmin && (
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateLocationDialogOpen(true)}>Create Location</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Gates Tab */}
        {activeTab === 'gates' && (
          <div className="space-y-6">
            {/* Administrators and Security Department Managers can create gates */}
            {userInfo && canManageGates(userInfo) && (
              <div className="flex justify-end">
                <Button onClick={() => setIsCreateGateDialogOpen(true)}>Create Gate</Button>
              </div>
            )}

            {gatesLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-gray-600">Loading gates...</div>
              </div>
            ) : gates && gates.length > 0 ? (
              <div className="rounded-lg px-2.5 bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Code</TableHeader>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Location</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Monitored</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gates.map((gate) => (
                      <TableRow key={gate.id}>
                        <TableCell className="font-mono text-sm">{gate.gateCode}</TableCell>
                        <TableCell className="font-medium">{gate.gateName}</TableCell>
                        <TableCell>{formatGateType(gate.gateType)}</TableCell>
                        <TableCell>{getLocationName(gate.locationId)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={gate.description || ''}>
                            {gate.description || <span className="text-gray-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {gate.isMonitored ? (
                            <Badge color="blue">Yes</Badge>
                          ) : (
                            <Badge color="zinc">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {gate.isActive ? (
                            <Badge color="green">Active</Badge>
                          ) : (
                            <Badge color="red">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Administrators and Security Department Managers can edit/delete gates */}
                          {userInfo && canManageGates(userInfo) ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedGate(gate);
                                  setGateForm({
                                    locationId: gate.locationId,
                                    gateCode: gate.gateCode,
                                    gateName: gate.gateName,
                                    gateType: gate.gateType.toLowerCase(),
                                    description: gate.description || '',
                                    isMonitored: gate.isMonitored,
                                  });
                                  setIsEditGateDialogOpen(true);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <span className="text-zinc-300 dark:text-zinc-600">|</span>
                              <button
                                onClick={() => {
                                  setSelectedGate(gate);
                                  setIsDeleteGateDialogOpen(true);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <Subheading className="mt-4">No gates found</Subheading>
                <Text className="mt-2">
                  {locations && locations.length > 0
                    ? 'Create your first gate to get started'
                    : 'Create a location first, then add gates to it'}
                </Text>
                {userInfo && canManageGates(userInfo) && (
                  <div className="mt-6">
                    {locations && locations.length > 0 ? (
                      <Button onClick={() => setIsCreateGateDialogOpen(true)}>Create Gate</Button>
                    ) : isAdmin ? (
                      <Button onClick={() => setActiveTab('locations')}>Create Location First</Button>
                    ) : (
                      <Text className="text-sm text-zinc-500">Ask an administrator to create a location first</Text>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Location Dialog */}
        <Dialog open={isCreateLocationDialogOpen} onClose={setIsCreateLocationDialogOpen}>
          <DialogTitle>Create New Location</DialogTitle>
          <DialogDescription>
            Add a new physical location for your organization (branch, campus, regional office, etc.)
          </DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Location Code *</Label>
                <Description>Unique identifier for this location (e.g., "HQ-01", "BRANCH-NYC")</Description>
                <Input
                  value={locationForm.locationCode}
                  onChange={(e) => setLocationForm({ ...locationForm, locationCode: e.target.value })}
                  placeholder="e.g., HQ-01"
                />
              </Field>

              <Field>
                <Label>Location Name *</Label>
                <Input
                  value={locationForm.locationName}
                  onChange={(e) => setLocationForm({ ...locationForm, locationName: e.target.value })}
                  placeholder="e.g., Main Headquarters"
                />
              </Field>

              <Field>
                <Label>Location Type</Label>
                <Select
                  value={locationForm.locationType}
                  onChange={(e) => setLocationForm({ ...locationForm, locationType: e.target.value })}
                >
                  <option value="main_office">Main Office</option>
                  <option value="branch_office">Branch Office</option>
                  <option value="regional_office">Regional Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="retail_store">Retail Store</option>
                  <option value="campus">Campus</option>
                  <option value="factory">Factory</option>
                  <option value="data_center">Data Center</option>
                </Select>
              </Field>

              <Field>
                <Label>Address</Label>
                <Input
                  value={locationForm.addressLine1}
                  onChange={(e) => setLocationForm({ ...locationForm, addressLine1: e.target.value })}
                  placeholder="Street address"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>City</Label>
                  <Input
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="City"
                  />
                </Field>

                <Field>
                  <Label>Country</Label>
                  <Input
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    placeholder="Country"
                  />
                </Field>
              </div>

              <Field>
                <Label>Phone Number</Label>
                <Input
                  value={locationForm.phoneNumber}
                  onChange={(e) => setLocationForm({ ...locationForm, phoneNumber: e.target.value })}
                  placeholder="+1-555-0123"
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsCreateLocationDialogOpen(false);
                resetLocationForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLocation} disabled={createLocationMutation.isPending}>
              {createLocationMutation.isPending ? 'Creating...' : 'Create Location'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Gate Dialog */}
        <Dialog open={isCreateGateDialogOpen} onClose={setIsCreateGateDialogOpen}>
          <DialogTitle>Create New Gate</DialogTitle>
          <DialogDescription>
            Add a new security gate or entry/exit point to a location.
            Some gate types are restricted to one per location for security best practices.
          </DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Location *</Label>
                <Description>Select the location where this gate is located</Description>
                <Select
                  value={gateForm.locationId}
                  onChange={(e) => {
                    const newLocationId = e.target.value;
                    setGateForm(prev => {
                      // If current gate type is unavailable at new location, switch to an available type
                      if (isGateTypeUnavailable(prev.gateType, newLocationId)) {
                        // Find first available gate type
                        const availableTypes = ['side_gate', 'back_entrance', 'main_gate', 'vip_entrance', 'staff_entrance', 'parking_entrance'];
                        const availableType = availableTypes.find(type => !isGateTypeUnavailable(type, newLocationId)) || 'side_gate';
                        return { ...prev, locationId: newLocationId, gateType: availableType };
                      }
                      return { ...prev, locationId: newLocationId };
                    });
                  }}
                >
                  <option value="">Select a location</option>
                  {locations?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.locationName} ({location.locationCode})
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Show existing gates at selected location */}
              {gateForm.locationId && getExistingGatesAtLocation(gateForm.locationId).length > 0 && (
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Existing gates at this location:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    {getExistingGatesAtLocation(gateForm.locationId).map((gate) => (
                      <li key={gate.id}>
                        • {formatGateType(gate.gateType)} - {gate.gateName} ({gate.gateCode})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Field>
                <Label>Gate Code *</Label>
                <Description>Unique identifier for this gate (e.g., "GATE-01", "MAIN-ENTRANCE")</Description>
                <Input
                  value={gateForm.gateCode}
                  onChange={(e) => setGateForm({ ...gateForm, gateCode: e.target.value })}
                  placeholder="e.g., GATE-01"
                />
              </Field>

              <Field>
                <Label>Gate Name *</Label>
                <Input
                  value={gateForm.gateName}
                  onChange={(e) => setGateForm({ ...gateForm, gateName: e.target.value })}
                  placeholder="e.g., Main Entrance Gate"
                />
              </Field>

              <Field>
                <Label>Gate Type *</Label>
                <Description className="mb-2">
                  {getGateTypeInfo(gateForm.gateType) || 'Select a gate type'}
                </Description>
                <Select
                  value={gateForm.gateType}
                  onChange={(e) => setGateForm({ ...gateForm, gateType: e.target.value })}
                >
                  <option
                    value="main_gate"
                    disabled={isGateTypeUnavailable('main_gate', gateForm.locationId)}
                  >
                    Main Gate{isGateTypeUnavailable('main_gate', gateForm.locationId) ? ' (Already exists)' : ''}
                  </option>
                  <option
                    value="vip_entrance"
                    disabled={isGateTypeUnavailable('vip_entrance', gateForm.locationId)}
                  >
                    VIP Entrance{isGateTypeUnavailable('vip_entrance', gateForm.locationId) ? ' (Already exists)' : ''}
                  </option>
                  <option
                    value="staff_entrance"
                    disabled={isGateTypeUnavailable('staff_entrance', gateForm.locationId)}
                  >
                    Staff Entrance{isGateTypeUnavailable('staff_entrance', gateForm.locationId) ? ' (Already exists)' : ''}
                  </option>
                  <option
                    value="parking_entrance"
                    disabled={isGateTypeUnavailable('parking_entrance', gateForm.locationId)}
                  >
                    Parking Entrance{isGateTypeUnavailable('parking_entrance', gateForm.locationId) ? ' (Already exists)' : ''}
                  </option>
                  <option value="side_gate">Side Gate (Multiple allowed)</option>
                  <option value="back_entrance">Back Entrance (Multiple allowed)</option>
                </Select>
              </Field>

              <Field>
                <Label>Description</Label>
                <Textarea
                  value={gateForm.description}
                  onChange={(e) => setGateForm({ ...gateForm, description: e.target.value })}
                  rows={3}
                  placeholder="Additional details about this gate"
                />
              </Field>

              <CheckboxField>
                <Checkbox
                  checked={gateForm.isMonitored}
                  onChange={(checked) => setGateForm({ ...gateForm, isMonitored: checked })}
                />
                <Label>Monitored Gate</Label>
                <Description>Enable if this gate has 24/7 security monitoring</Description>
              </CheckboxField>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsCreateGateDialogOpen(false);
                resetGateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGate} disabled={createGateMutation.isPending}>
              {createGateMutation.isPending ? 'Creating...' : 'Create Gate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Location Dialog */}
        <Dialog open={isEditLocationDialogOpen} onClose={setIsEditLocationDialogOpen}>
          <DialogTitle>Edit Location</DialogTitle>
          <DialogDescription>
            Update the details for {selectedLocation?.locationName}. Location code cannot be changed for audit purposes.
          </DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Location Code (Read-only)</Label>
                <Description>Cannot be changed for audit trail purposes</Description>
                <Input
                  value={locationForm.locationCode}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                />
              </Field>

              <Field>
                <Label>Location Name *</Label>
                <Input
                  value={locationForm.locationName}
                  onChange={(e) => setLocationForm({ ...locationForm, locationName: e.target.value })}
                  placeholder="e.g., Main Headquarters"
                />
              </Field>

              <Field>
                <Label>Location Type</Label>
                <Select
                  value={locationForm.locationType}
                  onChange={(e) => setLocationForm({ ...locationForm, locationType: e.target.value })}
                >
                  <option value="main_office">Main Office</option>
                  <option value="branch_office">Branch Office</option>
                  <option value="regional_office">Regional Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="retail_store">Retail Store</option>
                  <option value="campus">Campus</option>
                  <option value="factory">Factory</option>
                  <option value="data_center">Data Center</option>
                </Select>
              </Field>

              <Field>
                <Label>Address</Label>
                <Input
                  value={locationForm.addressLine1}
                  onChange={(e) => setLocationForm({ ...locationForm, addressLine1: e.target.value })}
                  placeholder="Street address"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>City</Label>
                  <Input
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="City"
                  />
                </Field>

                <Field>
                  <Label>Country</Label>
                  <Input
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    placeholder="Country"
                  />
                </Field>
              </div>

              <Field>
                <Label>Phone Number</Label>
                <Input
                  value={locationForm.phoneNumber}
                  onChange={(e) => setLocationForm({ ...locationForm, phoneNumber: e.target.value })}
                  placeholder="+1-555-0123"
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsEditLocationDialogOpen(false);
                setSelectedLocation(null);
                resetLocationForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedLocation) return;
                if (!locationForm.locationName.trim()) {
                  setError('Location name is required');
                  setTimeout(() => setError(''), 3000);
                  return;
                }
                updateLocationMutation.mutate({
                  locationId: selectedLocation.id,
                  locationName: locationForm.locationName,
                  locationType: locationForm.locationType,
                  addressLine1: locationForm.addressLine1 || undefined,
                  city: locationForm.city || undefined,
                  country: locationForm.country || undefined,
                  phoneNumber: locationForm.phoneNumber || undefined,
                });
              }}
              disabled={updateLocationMutation.isPending}
            >
              {updateLocationMutation.isPending ? 'Updating...' : 'Update Location'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Gate Dialog */}
        <Dialog open={isEditGateDialogOpen} onClose={setIsEditGateDialogOpen}>
          <DialogTitle>Edit Gate</DialogTitle>
          <DialogDescription>
            Update the details for {selectedGate?.gateName}. Gate code and location cannot be changed for audit purposes.
          </DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Location (Read-only)</Label>
                <Description>Cannot be changed after creation</Description>
                <Input
                  value={getLocationName(gateForm.locationId)}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                />
              </Field>

              <Field>
                <Label>Gate Code (Read-only)</Label>
                <Description>Cannot be changed for audit trail purposes</Description>
                <Input
                  value={gateForm.gateCode}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                />
              </Field>

              <Field>
                <Label>Gate Name *</Label>
                <Input
                  value={gateForm.gateName}
                  onChange={(e) => setGateForm({ ...gateForm, gateName: e.target.value })}
                  placeholder="e.g., Main Entrance Gate"
                />
              </Field>

              <Field>
                <Label>Gate Type *</Label>
                <Description className="mb-2">
                  {getGateTypeInfo(gateForm.gateType) || 'Select a gate type'}
                </Description>
                <Select
                  value={gateForm.gateType}
                  onChange={(e) => setGateForm({ ...gateForm, gateType: e.target.value })}
                >
                  <option
                    value="main_gate"
                    disabled={
                      selectedGate?.gateType.toLowerCase() !== 'main_gate' &&
                      isGateTypeUnavailable('main_gate', gateForm.locationId)
                    }
                  >
                    Main Gate
                    {selectedGate?.gateType.toLowerCase() !== 'main_gate' &&
                      isGateTypeUnavailable('main_gate', gateForm.locationId) &&
                      ' (Already exists)'}
                  </option>
                  <option
                    value="vip_entrance"
                    disabled={
                      selectedGate?.gateType.toLowerCase() !== 'vip_entrance' &&
                      isGateTypeUnavailable('vip_entrance', gateForm.locationId)
                    }
                  >
                    VIP Entrance
                    {selectedGate?.gateType.toLowerCase() !== 'vip_entrance' &&
                      isGateTypeUnavailable('vip_entrance', gateForm.locationId) &&
                      ' (Already exists)'}
                  </option>
                  <option
                    value="staff_entrance"
                    disabled={
                      selectedGate?.gateType.toLowerCase() !== 'staff_entrance' &&
                      isGateTypeUnavailable('staff_entrance', gateForm.locationId)
                    }
                  >
                    Staff Entrance
                    {selectedGate?.gateType.toLowerCase() !== 'staff_entrance' &&
                      isGateTypeUnavailable('staff_entrance', gateForm.locationId) &&
                      ' (Already exists)'}
                  </option>
                  <option
                    value="parking_entrance"
                    disabled={
                      selectedGate?.gateType.toLowerCase() !== 'parking_entrance' &&
                      isGateTypeUnavailable('parking_entrance', gateForm.locationId)
                    }
                  >
                    Parking Entrance
                    {selectedGate?.gateType.toLowerCase() !== 'parking_entrance' &&
                      isGateTypeUnavailable('parking_entrance', gateForm.locationId) &&
                      ' (Already exists)'}
                  </option>
                  <option value="side_gate">Side Gate (Multiple allowed)</option>
                  <option value="back_entrance">Back Entrance (Multiple allowed)</option>
                </Select>
              </Field>

              <Field>
                <Label>Description</Label>
                <Textarea
                  value={gateForm.description}
                  onChange={(e) => setGateForm({ ...gateForm, description: e.target.value })}
                  rows={3}
                  placeholder="Additional details about this gate"
                />
              </Field>

              <CheckboxField>
                <Checkbox
                  checked={gateForm.isMonitored}
                  onChange={(checked) => setGateForm({ ...gateForm, isMonitored: checked })}
                />
                <Label>Monitored Gate</Label>
                <Description>Enable if this gate has 24/7 security monitoring</Description>
              </CheckboxField>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsEditGateDialogOpen(false);
                setSelectedGate(null);
                resetGateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedGate) return;
                if (!gateForm.gateName.trim()) {
                  setError('Gate name is required');
                  setTimeout(() => setError(''), 3000);
                  return;
                }
                updateGateMutation.mutate({
                  gateId: selectedGate.id,
                  gateName: gateForm.gateName,
                  gateType: gateForm.gateType.toUpperCase() as GateLocationType,
                  description: gateForm.description || undefined,
                  isMonitored: gateForm.isMonitored,
                });
              }}
              disabled={updateGateMutation.isPending}
            >
              {updateGateMutation.isPending ? 'Updating...' : 'Update Gate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Location Confirmation Dialog */}
        <Dialog open={isDeleteLocationDialogOpen} onClose={setIsDeleteLocationDialogOpen}>
          <DialogTitle>Delete Location</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{selectedLocation?.locationName}</strong>?
            This will deactivate the location. You cannot delete a location with active gates.
          </DialogDescription>
          <DialogBody>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This action will mark the location as inactive. If there are any active
                gates at this location, the deletion will fail and you must delete or deactivate those gates first.
              </p>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsDeleteLocationDialogOpen(false);
                setSelectedLocation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (!selectedLocation) return;
                deleteLocationMutation.mutate(selectedLocation.id);
              }}
              disabled={deleteLocationMutation.isPending}
            >
              {deleteLocationMutation.isPending ? 'Deleting...' : 'Delete Location'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Gate Confirmation Dialog */}
        <Dialog open={isDeleteGateDialogOpen} onClose={setIsDeleteGateDialogOpen}>
          <DialogTitle>Delete Gate</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{selectedGate?.gateName}</strong>?
            This will deactivate the gate.
          </DialogDescription>
          <DialogBody>
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This action will mark the gate as inactive. The gate will no longer be available for visitor check-ins.
              </p>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              outline
              onClick={() => {
                setIsDeleteGateDialogOpen(false);
                setSelectedGate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (!selectedGate) return;
                deleteGateMutation.mutate(selectedGate.id);
              }}
              disabled={deleteGateMutation.isPending}
            >
              {deleteGateMutation.isPending ? 'Deleting...' : 'Delete Gate'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
