'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Users, Clock, AlertCircle, Shield } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Divider } from '@/app/components/divider';
import { Badge } from '@/app/components/badge';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import {
  getShiftAssignments,
  getDepartmentExternalStaff
} from '@/lib/security-department-api';
import { formatGateLocation, type GateLocation } from '@/lib/security-queries-api';

interface GateInfo {
  id: string;
  name: string;
  gateLocation: GateLocation;
  description: string;
  isCovered: boolean;
  currentStaff?: string;
  staffId?: string;
  badgeNumber?: string;
  shiftTime?: string;
  assignedStaffCount: number;
  status: string;
}

export default function GateManagementPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [gates, setGates] = useState<GateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGate, setSelectedGate] = useState<GateInfo | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [shiftStartDate, setShiftStartDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [requiresHandover, setRequiresHandover] = useState(false);
  const [shiftNotes, setShiftNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

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

    // Fetch gate data
    fetchGateData();
  }, [router]);

  const fetchGateData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both active and scheduled shifts
      const activeShifts = await getShiftAssignments({ status: 'ACTIVE' });
      const scheduledShifts = await getShiftAssignments({ status: 'SCHEDULED' });
      const shifts = [...activeShifts, ...scheduledShifts];

      // Fetch all external staff to get their details
      const staff = await getDepartmentExternalStaff();

      // Define all gates
      const allGates: GateLocation[] = [
        'MAIN_GATE',
        'SIDE_GATE',
        'STAFF_ENTRANCE',
        'VIP_ENTRANCE',
        'PARKING_ENTRANCE',
        'BACK_ENTRANCE',
      ];

      // Build gate info from shifts
      const gateData: GateInfo[] = allGates.map((gateLocation) => {
        // Find shifts for this gate
        const gateShifts = shifts.filter((shift) => shift.gateLocation === gateLocation);
        const activeShift = gateShifts.find((shift) => shift.status === 'ACTIVE');
        const scheduledShift = gateShifts.find((shift) => shift.status === 'SCHEDULED');

        // Prefer active shift, fall back to scheduled
        const displayShift = activeShift || scheduledShift;

        // Get staff details if there's a shift to display
        let currentStaff: string | undefined;
        let badgeNumber: string | undefined;
        let staffId: string | undefined;

        if (displayShift) {
          const staffMember = staff.find((s) => s.id === displayShift.staffId);
          if (staffMember) {
            currentStaff = `${staffMember.firstName} ${staffMember.lastName}`;
            badgeNumber = staffMember.badgeNumber || undefined;
            staffId = staffMember.id;
          }
        }

        // Format shift time
        const shiftTime = displayShift
          ? `${new Date(displayShift.shiftStart).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })} - ${new Date(displayShift.shiftEnd).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}`
          : undefined;

        return {
          id: gateLocation,
          name: formatGateLocation(gateLocation),
          gateLocation,
          description: getGateDescription(gateLocation),
          isCovered: !!activeShift,
          currentStaff,
          staffId,
          badgeNumber,
          shiftTime,
          assignedStaffCount: gateShifts.length,
          status: activeShift ? 'Active' : scheduledShift ? 'Scheduled' : 'Vacant',
        };
      });

      setGates(gateData);
    } catch (err: any) {
      console.error('Failed to fetch gate data:', err);
      setError(err.message || 'Failed to load gate data');
    } finally {
      setLoading(false);
    }
  };

  const getGateDescription = (gate: GateLocation): string => {
    const descriptions: Record<GateLocation, string> = {
      MAIN_GATE: 'Primary entrance for visitors and staff',
      SIDE_GATE: 'Secondary entrance for staff access',
      STAFF_ENTRANCE: 'Dedicated staff entrance',
      VIP_ENTRANCE: 'VIP and executive entrance',
      PARKING_ENTRANCE: 'Vehicle entrance for parking area',
      BACK_ENTRANCE: 'Service and delivery entrance',
    };
    return descriptions[gate] || 'Security checkpoint';
  };

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

  const openAssignModal = async (gate: GateInfo) => {
    setSelectedGate(gate);
    setShowAssignModal(true);

    // Fetch available staff
    try {
      const staff = await getDepartmentExternalStaff();
      setAvailableStaff(staff.filter(s => s.isActive));
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to load available staff');
    }

    // Set default date and time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    setShiftStartDate(tomorrow.toISOString().split('T')[0]);
    setShiftStartTime('08:00');
    setShiftEndTime('16:00');
    setRequiresHandover(false);
    setShiftNotes('');
    setSelectedStaffId('');
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedGate(null);
    setSelectedStaffId('');
    setShiftStartDate('');
    setShiftStartTime('');
    setShiftEndTime('');
    setRequiresHandover(false);
    setShiftNotes('');
  };

  const handleAssignStaff = async () => {
    if (!selectedGate || !selectedStaffId || !shiftStartDate || !shiftStartTime || !shiftEndTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      // Create ISO datetime strings
      const shiftStart = new Date(`${shiftStartDate}T${shiftStartTime}:00`).toISOString();
      const shiftEnd = new Date(`${shiftStartDate}T${shiftEndTime}:00`).toISOString();

      // Call the API to create shift assignment
      // Note: organizationId and organizationType are derived from auth token on backend for security
      const mutation = `
        mutation CreateShiftAssignment($input: CreateShiftAssignmentInput!) {
          createShiftAssignment(input: $input) {
            id
            staffId
            gateLocation
            shiftStart
            shiftEnd
            status
          }
        }
      `;

      const { graphql } = await import('@/lib/graphql');

      await graphql(mutation, {
        input: {
          staffId: selectedStaffId,
          gateLocation: selectedGate.gateLocation,
          shiftStart,
          shiftEnd,
          requiresHandover,
          notes: shiftNotes || null,
        },
      });

      // Success! Refresh gate data
      await fetchGateData();
      closeAssignModal();
    } catch (err: any) {
      console.error('Failed to assign staff:', err);
      setError(err.message || 'Failed to assign staff to shift');
    } finally {
      setAssigning(false);
    }
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

  const coveredGates = gates.filter(g => g.isCovered).length;
  const totalGates = gates.length;
  const coverageRate = totalGates > 0 ? Math.round((coveredGates / totalGates) * 100) : 0;

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
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-8 w-8 text-purple-600" />
            <Heading>Gate Management</Heading>
          </div>
          <Text className="mt-2">
            Monitor and manage security staff assignments across all gates
          </Text>
        </div>

        <Divider />

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
            <Button outline className="mt-2" onClick={fetchGateData}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600">Loading gate data...</p>
          </div>
        )}

        {/* Coverage Summary */}
        {!loading && !error && (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Coverage Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Gates Covered</p>
                  <p className="text-3xl font-bold text-zinc-900">
                    {coveredGates} / {totalGates}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-600 mb-1">Coverage Rate</p>
                  <p className="text-3xl font-bold text-green-600">{coverageRate}%</p>
                </div>
              </div>
            </div>

            {/* Gate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gates.length > 0 ? gates.map((gate) => (
            <div
              key={gate.id}
              className={`rounded-lg border p-6 ${
                gate.status === 'Active'
                  ? 'bg-green-50 border-green-200'
                  : gate.status === 'Scheduled'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {/* Gate Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                    <MapPin
                      className={`h-5 w-5 ${
                        gate.status === 'Active'
                          ? 'text-green-600'
                          : gate.status === 'Scheduled'
                          ? 'text-blue-600'
                          : 'text-red-600'
                      }`}
                    />
                    {gate.name}
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">{gate.description}</p>
                </div>
                <Badge
                  color={
                    gate.status === 'Active'
                      ? 'green'
                      : gate.status === 'Scheduled'
                      ? 'blue'
                      : 'red'
                  }
                >
                  {gate.status === 'Active' ? 'MANNED' : gate.status === 'Scheduled' ? 'SCHEDULED' : 'VACANT'}
                </Badge>
              </div>

              {/* Active Shift */}
              {gate.status === 'Active' && gate.currentStaff && (
                <div className="rounded-lg bg-white p-4 mb-4 shadow-sm ring-1 ring-zinc-950/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-700 font-medium mb-1">Currently On Duty</p>
                      <p className="font-medium text-zinc-900">{gate.currentStaff}</p>
                      <p className="text-xs text-zinc-600">Badge: {gate.badgeNumber}</p>
                    </div>
                  </div>
                  {gate.shiftTime && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                      <Clock className="h-4 w-4" />
                      <span>{gate.shiftTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Shift */}
              {gate.status === 'Scheduled' && gate.currentStaff && (
                <div className="rounded-lg bg-white p-4 mb-4 shadow-sm ring-1 ring-zinc-950/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 font-medium mb-1">Scheduled Assignment</p>
                      <p className="font-medium text-zinc-900">{gate.currentStaff}</p>
                      <p className="text-xs text-zinc-600">Badge: {gate.badgeNumber}</p>
                    </div>
                  </div>
                  {gate.shiftTime && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                      <Clock className="h-4 w-4" />
                      <span>{gate.shiftTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* No Coverage */}
              {gate.status === 'Vacant' && (
                <div className="rounded-lg bg-white p-4 mb-4 text-center shadow-sm ring-1 ring-zinc-950/5">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-700">No staff currently assigned</p>
                </div>
              )}

              {/* Staff Count */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Assigned Staff:</span>
                  <span className="font-medium text-zinc-900">{gate.assignedStaffCount}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  color="blue"
                  className="flex-1"
                  onClick={() => openAssignModal(gate)}
                >
                  Assign Staff
                </Button>
                <Button
                  outline
                  className="flex-1"
                  onClick={() => router.push('/dashboard/department/security/shifts')}
                >
                  Schedule
                </Button>
              </div>
            </div>
          )) : (
            <div className="col-span-2 rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5">
              <MapPin className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <Text className="text-zinc-500">
                No gate data available. Configure gates and assign security staff to get started.
              </Text>
            </div>
          )}
        </div>
      </>
    )}

    {/* Assign Staff Modal */}
    {showAssignModal && selectedGate && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">
            Assign Staff to {selectedGate.name}
          </h3>
          <p className="text-sm text-zinc-600 mb-6">
            Create a new shift assignment for this gate
          </p>

          <div className="space-y-4">
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">
                Select Security Staff *
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Select Staff Member --</option>
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName} - {staff.badgeNumber} ({staff.securityRole})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Date */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">
                Shift Date *
              </label>
              <input
                type="date"
                value={shiftStartDate}
                onChange={(e) => setShiftStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Handover Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresHandover"
                checked={requiresHandover}
                onChange={(e) => setRequiresHandover(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="requiresHandover" className="text-sm text-zinc-900">
                Requires shift handover (staff must complete handover before checkout)
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Additional notes for this shift..."
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-zinc-200">
            <Button outline onClick={closeAssignModal} disabled={assigning}>
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleAssignStaff}
              disabled={assigning || !selectedStaffId || !shiftStartDate || !shiftStartTime || !shiftEndTime}
            >
              {assigning ? 'Assigning...' : 'Assign Staff'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </div>
    </ApplicationLayout>
  );
}
