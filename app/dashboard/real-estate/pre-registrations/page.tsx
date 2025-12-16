'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApplicationLayout } from '../../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { getMyProperties, getPreRegistrationsByProperty, getTodaysExpectedVisitors } from '@/lib/real-estate-api';
import type { Property, VisitorPreRegistration, PreRegistrationStatus } from '@/types/real-estate';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { ClipboardDocumentCheckIcon, QrCodeIcon, CalendarIcon } from '@heroicons/react/20/solid';

export default function PreRegistrationsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Fetch pre-registrations based on view mode
  const { data: preRegistrations, isLoading: preRegsLoading } = useQuery({
    queryKey: ['pre-registrations', selectedPropertyId, viewMode],
    queryFn: () =>
      viewMode === 'today'
        ? getTodaysExpectedVisitors(selectedPropertyId)
        : getPreRegistrationsByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  const getStatusBadge = (status: PreRegistrationStatus) => {
    const badges = {
      pending: { color: 'amber' as const, label: 'Pending' },
      approved: { color: 'lime' as const, label: 'Approved' },
      rejected: { color: 'red' as const, label: 'Rejected' },
      expired: { color: 'zinc' as const, label: 'Expired' },
      checked_in: { color: 'blue' as const, label: 'Checked In' },
      cancelled: { color: 'purple' as const, label: 'Cancelled' },
    };
    const badge = badges[status];
    return <Badge color={badge.color}>{badge.label}</Badge>;
  };

  const formatDateTime = (date: string, time?: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return time ? `${dateStr} at ${time}` : dateStr;
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

  // Filter pre-registrations by status
  const filteredPreRegs = preRegistrations?.filter((preReg) =>
    statusFilter === 'all' ? true : preReg.registrationStatus === statusFilter
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Visitor Pre-Registrations</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage pre-registered visitors created by tenants
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Property Selector */}
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

          {/* View Mode and Filters */}
          {selectedPropertyId && (
            <div className="flex items-center gap-4">
              <Select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'today' | 'all')} className="w-48">
                <option value="today">Today's Visitors</option>
                <option value="all">All Pre-Registrations</option>
              </Select>

              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="checked_in">Checked In</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              {filteredPreRegs && (
                <div className="text-sm text-gray-600">
                  Showing {filteredPreRegs.length} {filteredPreRegs.length === 1 ? 'visitor' : 'visitors'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pre-Registrations List */}
        {selectedPropertyId && (
          <>
            {preRegsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading pre-registrations...</div>
              </div>
            ) : !filteredPreRegs || filteredPreRegs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {statusFilter !== 'all' ? 'No matching visitors' : 'No pre-registered visitors'}
                </h3>
                <p className="text-gray-500">
                  {viewMode === 'today'
                    ? 'There are no visitors expected today'
                    : 'Tenants can pre-register visitors using the mobile app or SMS'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Visitor</TableHeader>
                      <TableHeader>Tenant & Unit</TableHeader>
                      <TableHeader>Expected Arrival</TableHeader>
                      <TableHeader>Purpose</TableHeader>
                      <TableHeader>Vehicle</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>QR Code</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPreRegs.map((preReg) => (
                      <TableRow key={preReg.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {preReg.visitorFirstName} {preReg.visitorLastName}
                            </div>
                            <div className="text-sm text-gray-500">{preReg.visitorPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">Unit: {preReg.unitId}</div>
                            <div className="text-gray-500">Tenant ID: {preReg.tenantId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDateTime(preReg.expectedArrivalDate, preReg.expectedArrivalTime)}
                          </div>
                          {preReg.checkedInAt && (
                            <div className="text-xs text-blue-600 mt-1">
                              Checked in: {new Date(preReg.checkedInAt).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {preReg.purposeOfVisit}
                          </div>
                        </TableCell>
                        <TableCell>
                          {preReg.hasVehicle ? (
                            <div className="text-sm">
                              <div className="font-medium">{preReg.vehicleRegistration}</div>
                              {preReg.parkingRequired && (
                                <Badge color="green" className="text-xs mt-1">
                                  Parking Required
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No vehicle</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(preReg.registrationStatus)}</TableCell>
                        <TableCell>
                          {preReg.qrCodeData && preReg.registrationStatus === 'approved' ? (
                            <Button
                              plain
                              onClick={() => {
                                // Open QR code in modal or new window
                                alert(`QR Code Data: ${preReg.qrCodeData}`);
                              }}
                            >
                              <QrCodeIcon className="w-5 h-5" />
                              View
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {preReg.registrationStatus === 'approved' && !preReg.checkedInAt && (
                              <Button
                                outline
                                onClick={() => {
                                  // TODO: Implement check-in functionality
                                  alert('Check-in functionality coming soon');
                                }}
                              >
                                Check In
                              </Button>
                            )}
                            {preReg.registrationStatus === 'pending' && (
                              <Button
                                outline
                                onClick={() => {
                                  // TODO: Implement cancel functionality
                                  alert('Cancel functionality coming soon');
                                }}
                              >
                                Cancel
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
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
            <p className="text-gray-500">Choose a property to view pre-registered visitors</p>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
