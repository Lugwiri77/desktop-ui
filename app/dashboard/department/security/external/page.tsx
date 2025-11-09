'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserCheck, Search, Shield, MapPin } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Field, Label } from '@/app/components/fieldset';
import { Divider } from '@/app/components/divider';
import { Badge } from '@/app/components/badge';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import { getDepartmentExternalStaff } from '@/lib/security-department-api';

interface ExternalStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber?: string;
  securityRole: string;
  badgeNumber?: string;
  assignedGate?: string;
  isActive: boolean;
}

export default function ExternalStaffManagementPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [externalStaff, setExternalStaff] = useState<ExternalStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<ExternalStaffMember | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

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

    // Check if user has access to Security Department
    if (info.staffRole !== 'DepartmentManager' || info.department !== 'Security') {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);

    // Fetch external staff data
    const fetchExternalStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const staff = await getDepartmentExternalStaff();
        setExternalStaff(staff);
      } catch (err: any) {
        console.error('Failed to fetch external staff:', err);
        setError(err.message || 'Failed to load external staff');
      } finally {
        setLoading(false);
      }
    };

    fetchExternalStaff();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleViewDetails = (staff: ExternalStaffMember) => {
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

  const handleManageStaff = (staff: ExternalStaffMember) => {
    setSelectedStaff(staff);
    setShowManageModal(true);
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowManageModal(false);
    setSelectedStaff(null);
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

  const filteredStaff = externalStaff.filter(
    (staff) =>
      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.workEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.badgeNumber && staff.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          outline
          onClick={() => router.push('/dashboard/department/security')}
          className="group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <Heading>External Security Staff</Heading>
            </div>
            <Button
              color="blue"
              onClick={() => router.push('/dashboard/department/security/external/register')}
            >
              Register External Staff
            </Button>
          </div>
          <Text className="mt-2">
            Manage external contractors and their access credentials
          </Text>
        </div>

        <Divider />

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Search External Staff
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or badge number..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600">Loading external staff...</p>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-950/5">
              <p className="text-sm text-zinc-600">Total External Staff</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{externalStaff.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-700">Active</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {externalStaff.filter((s) => s.isActive).length}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-700">Inactive</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {externalStaff.filter((s) => !s.isActive).length}
              </p>
            </div>
          </div>
        )}

        {/* Staff List */}
        {!loading && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Text>
                <strong>{filteredStaff.length}</strong> external staff members
              </Text>
            </div>

            <div className="rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 divide-y divide-zinc-950/5">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <div key={staff.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-zinc-900">
                            {staff.firstName} {staff.lastName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">Email:</span>
                            <span className="text-zinc-900">{staff.workEmail}</span>
                          </div>
                          {staff.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">Phone:</span>
                              <span className="text-zinc-900">{staff.phoneNumber}</span>
                            </div>
                          )}
                          {staff.badgeNumber && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">Badge:</span>
                              <span className="text-zinc-900">{staff.badgeNumber}</span>
                            </div>
                          )}
                          {staff.assignedGate && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-zinc-500" />
                              <span className="text-zinc-900">{staff.assignedGate}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge color="blue">{staff.securityRole}</Badge>
                          <Badge color={staff.isActive ? 'green' : 'red'}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button outline onClick={() => handleViewDetails(staff)}>View Details</Button>
                        <Button outline onClick={() => handleManageStaff(staff)}>Manage</Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <UserCheck className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                  <Text className="text-zinc-500">
                    {searchQuery
                      ? 'No external staff members match your search.'
                      : 'No external security staff found. Register your first contractor.'}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900">
                    Staff Member Details
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    Complete information for {selectedStaff.firstName} {selectedStaff.lastName}
                  </p>
                </div>
                <Badge color={selectedStaff.isActive ? 'green' : 'red'}>
                  {selectedStaff.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">First Name</p>
                      <p className="text-zinc-900 font-medium">{selectedStaff.firstName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Last Name</p>
                      <p className="text-zinc-900 font-medium">{selectedStaff.lastName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Work Email</p>
                      <p className="text-zinc-900 font-medium">{selectedStaff.workEmail}</p>
                    </div>
                    {selectedStaff.phoneNumber && (
                      <div>
                        <p className="text-zinc-500 mb-1">Phone Number</p>
                        <p className="text-zinc-900 font-medium">{selectedStaff.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Role & Assignment */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-3">Role & Assignment</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Security Role</p>
                      <Badge color="blue">{selectedStaff.securityRole}</Badge>
                    </div>
                    {selectedStaff.badgeNumber && (
                      <div>
                        <p className="text-zinc-500 mb-1">Badge Number</p>
                        <p className="text-zinc-900 font-medium">{selectedStaff.badgeNumber}</p>
                      </div>
                    )}
                    {selectedStaff.assignedGate && (
                      <div>
                        <p className="text-zinc-500 mb-1">Assigned Gate</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-zinc-500" />
                          <p className="text-zinc-900 font-medium">{selectedStaff.assignedGate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Status */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-3">Account Status</h4>
                  <div className="flex items-center gap-2">
                    <Badge color={selectedStaff.isActive ? 'green' : 'red'}>
                      {selectedStaff.isActive ? 'Active Account' : 'Inactive Account'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-zinc-200">
                <Button outline onClick={closeModals}>
                  Close
                </Button>
                <Button color="blue" onClick={() => {
                  setShowDetailsModal(false);
                  setShowManageModal(true);
                }}>
                  Edit Staff Member
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Manage/Edit Staff Modal */}
        {showManageModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                Manage Staff Member
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Edit information for {selectedStaff.firstName} {selectedStaff.lastName}
              </p>

              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Staff management features (update role, deactivate account, change assigned gate) require backend mutations to be implemented. These will be added in the next phase.
                  </p>
                </div>

                <div className="space-y-3">
                  <Field>
                    <Label>First Name</Label>
                    <Input value={selectedStaff.firstName} readOnly className="bg-zinc-50" />
                  </Field>

                  <Field>
                    <Label>Last Name</Label>
                    <Input value={selectedStaff.lastName} readOnly className="bg-zinc-50" />
                  </Field>

                  <Field>
                    <Label>Work Email</Label>
                    <Input value={selectedStaff.workEmail} readOnly className="bg-zinc-50" />
                  </Field>

                  {selectedStaff.phoneNumber && (
                    <Field>
                      <Label>Phone Number</Label>
                      <Input value={selectedStaff.phoneNumber} readOnly className="bg-zinc-50" />
                    </Field>
                  )}

                  <Field>
                    <Label>Security Role</Label>
                    <select
                      disabled
                      value={selectedStaff.securityRole}
                      className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900"
                    >
                      <option value="SECURITY_MANAGER">Security Manager</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="SECURITY_GUARD">Security Guard</option>
                    </select>
                  </Field>

                  {selectedStaff.assignedGate && (
                    <Field>
                      <Label>Assigned Gate</Label>
                      <Input value={selectedStaff.assignedGate} readOnly className="bg-zinc-50" />
                    </Field>
                  )}

                  <Field>
                    <Label>Account Status</Label>
                    <select
                      disabled
                      value={selectedStaff.isActive ? 'active' : 'inactive'}
                      className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-zinc-200">
                <Button outline onClick={closeModals}>
                  Cancel
                </Button>
                <Button color="blue" disabled>
                  Save Changes (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
