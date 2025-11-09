'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Users, Download } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShiftAssignments, useAllSecurityStaff, useAssignShift, useBulkAssignShifts, useUpdateShift, useCancelShift } from '@/hooks/use-security';
import { ShiftScheduler } from '@/app/components/security/ShiftScheduler';
import { GateLocation } from '@/lib/security-api';

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedStaffId = searchParams.get('staffId');

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Fetch shifts and staff
  const { data: shifts = [], isLoading: shiftsLoading } = useShiftAssignments({
    startDate,
    endDate,
    staffId: preSelectedStaffId || undefined,
  });

  const { data: allStaff, isLoading: staffLoading } = useAllSecurityStaff({
    status: 'active',
  });

  // Mutations
  const assignShiftMutation = useAssignShift();
  const bulkAssignMutation = useBulkAssignShifts();
  const updateShiftMutation = useUpdateShift();
  const cancelShiftMutation = useCancelShift();

  // Prepare staff list for scheduler
  const availableStaff = useMemo(() => {
    if (!allStaff) return [];
    return allStaff.all.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      role: s.securityRole,
    }));
  }, [allStaff]);

  const handleCreateShift = async (shiftData: {
    staffId: string;
    staffName: string;
    date: string;
    startTime: string;
    endTime: string;
    gate: GateLocation;
    requiresHandover: boolean;
  }) => {
    try {
      await assignShiftMutation.mutateAsync({
        securityStaffId: shiftData.staffId,
        shiftDate: shiftData.date,
        shiftStartTime: shiftData.startTime,
        shiftEndTime: shiftData.endTime,
        assignedGate: shiftData.gate,
        requiresHandover: shiftData.requiresHandover,
      });
    } catch (err) {
      console.error('Failed to create shift:', err);
      throw err;
    }
  };

  const handleUpdateShift = async (shiftId: string, updates: any) => {
    try {
      await updateShiftMutation.mutateAsync({
        assignmentId: shiftId,
        ...updates,
      });
    } catch (err) {
      console.error('Failed to update shift:', err);
      throw err;
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (confirm('Are you sure you want to cancel this shift?')) {
      try {
        await cancelShiftMutation.mutateAsync({
          assignmentId: shiftId,
          reason: 'Cancelled by administrator',
        });
      } catch (err) {
        console.error('Failed to cancel shift:', err);
        throw err;
      }
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: shifts.length,
      scheduled: shifts.filter(s => s.status === 'scheduled').length,
      active: shifts.filter(s => s.status === 'active').length,
      completed: shifts.filter(s => s.status === 'completed').length,
    };
  }, [shifts]);

  if (shiftsLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-400" />
                Shift Assignments
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Schedule and manage security staff shifts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              alert('Export feature coming soon');
            }}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export Schedule
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Shifts</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Scheduled</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.scheduled}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Completed</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="rounded-xl bg-zinc-500/10 p-3">
                <Calendar className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Scheduler */}
        <ShiftScheduler
          shifts={shifts}
          onCreateShift={handleCreateShift}
          onUpdateShift={handleUpdateShift}
          onDeleteShift={handleDeleteShift}
          availableStaff={availableStaff}
        />
      </div>
    </div>
  );
}
