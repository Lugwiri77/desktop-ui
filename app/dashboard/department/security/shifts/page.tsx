'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Plus, ArrowLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDepartmentExternalStaff } from '@/hooks/use-security-department';
import { GateLocation } from '@/lib/security-api';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function ShiftSchedulerPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGate, setSelectedGate] = useState<GateLocation | 'all'>('all');
  const { data: externalStaff = [], isLoading } = useDepartmentExternalStaff({ status: 'active' });

  // Mock shift data (in production, fetch from API)
  const [shifts] = useState([
    {
      id: '1',
      staffId: '1',
      staffName: 'John Doe',
      gate: 'main_gate',
      startTime: new Date(2025, 10, 3, 8, 0),
      endTime: new Date(2025, 10, 3, 16, 0),
      status: 'scheduled',
    },
    {
      id: '2',
      staffId: '2',
      staffName: 'Jane Smith',
      gate: 'side_gate',
      startTime: new Date(2025, 10, 3, 16, 0),
      endTime: new Date(2025, 10, 4, 0, 0),
      status: 'scheduled',
    },
  ]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const gates = [
    { value: 'all', label: 'All Gates' },
    { value: 'main_gate', label: 'Main Gate' },
    { value: 'side_gate', label: 'Side Gate' },
    { value: 'back_gate', label: 'Back Gate' },
    { value: 'parking_gate', label: 'Parking Gate' },
  ];

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(shift.startTime, date));
  };

  const getGateName = (gate: string) => {
    return gate.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-zinc-800 rounded w-64" />
            <div className="h-96 bg-zinc-800 rounded-xl" />
          </div>
        </div>
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
                Shift Scheduler
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Manage security staff shifts and schedules
              </p>
            </div>
          </div>
          <button
            onClick={() => {/* Open create shift modal */}}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Shift
          </button>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'day' | 'week' | 'month')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </select>

              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value as GateLocation | 'all')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {gates.map((gate) => (
                  <option key={gate.value} value={gate.value}>
                    {gate.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Week View Calendar */}
        {viewMode === 'week' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Week of {format(weekStart, 'MMM d, yyyy')}
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {weekDays.map((day) => (
                <div
                  key={day.toString()}
                  className={`text-center p-3 rounded-lg ${
                    isSameDay(day, new Date())
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-zinc-800'
                  }`}
                >
                  <p className="text-xs font-medium text-zinc-400">
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${
                    isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}

              {/* Shift Cards */}
              {weekDays.map((day) => {
                const dayShifts = getShiftsForDate(day);
                return (
                  <div
                    key={day.toString()}
                    className="min-h-[200px] p-2 rounded-lg bg-zinc-800/50 border border-white/5"
                  >
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="mb-2 p-2 rounded bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-medium text-blue-300">
                          {shift.staffName}
                        </p>
                        <p className="text-xs text-blue-200/70">
                          {getGateName(shift.gate)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-200/50">
                          <Clock className="h-3 w-3" />
                          {format(shift.startTime, 'HH:mm')}-{format(shift.endTime, 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayShifts.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <button
                          onClick={() => {/* Open create shift modal with this date */}}
                          className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                        >
                          + Add Shift
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shift List View */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Upcoming Shifts</h2>
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-white/5"
              >
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{shift.staffName}</p>
                  <p className="text-sm text-zinc-400">{getGateName(shift.gate)}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {format(shift.startTime, 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                    <Clock className="h-4 w-4" />
                    {format(shift.startTime, 'HH:mm')} - {format(shift.endTime, 'HH:mm')}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/50">
                  Scheduled
                </div>
              </div>
            ))}
            {shifts.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No shifts scheduled</p>
            )}
          </div>
        </div>

        {/* Available Staff */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Available Staff</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {externalStaff.slice(0, 6).map((staff) => (
              <div
                key={staff.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-white/5"
              >
                {staff.profilePicUrl ? (
                  <img
                    src={staff.profilePicUrl}
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                    <Users className="h-5 w-5 text-green-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {staff.firstName} {staff.lastName}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {staff.assignedGate ? getGateName(staff.assignedGate) : 'No gate assigned'}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
