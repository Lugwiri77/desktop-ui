'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, X, Save, AlertCircle } from 'lucide-react';
import { GateLocation, SecurityRole, ShiftAssignment, formatGateLocation } from '@/lib/security-api';

interface ShiftSchedulerProps {
  shifts: ShiftAssignment[];
  onCreateShift: (shift: {
    staffId: string;
    staffName: string;
    date: string;
    startTime: string;
    endTime: string;
    gate: GateLocation;
    requiresHandover: boolean;
  }) => void;
  onUpdateShift: (shiftId: string, updates: Partial<ShiftAssignment>) => void;
  onDeleteShift: (shiftId: string) => void;
  availableStaff: Array<{ id: string; firstName: string; lastName: string; role: SecurityRole }>;
  readonly?: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ShiftScheduler({
  shifts,
  onCreateShift,
  onUpdateShift,
  onDeleteShift,
  availableStaff,
  readonly = false,
}: ShiftSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftAssignment | null>(null);

  // Get dates for current view
  const viewDates = useMemo(() => {
    const dates: Date[] = [];

    if (viewMode === 'day') {
      dates.push(new Date(currentDate));
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
      }
    } else {
      // Month view - simplified to show current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
      }
    }

    return dates;
  }, [currentDate, viewMode]);

  // Filter shifts for current view
  const visibleShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.shiftDate);
      return viewDates.some(date =>
        date.toDateString() === shiftDate.toDateString()
      );
    });
  }, [shifts, viewDates]);

  // Navigate dates
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return visibleShifts.filter(shift => {
      const shiftDate = new Date(shift.shiftDate);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  // Check for shift conflicts
  const hasConflict = (date: string, startTime: string, endTime: string, staffId: string, excludeShiftId?: string) => {
    const dateShifts = shifts.filter(s =>
      s.shiftDate === date &&
      s.securityStaffId === staffId &&
      s.id !== excludeShiftId
    );

    // Simple time overlap check
    return dateShifts.some(shift => {
      return !(endTime <= shift.shiftStartTime || startTime >= shift.shiftEndTime);
    });
  };

  const formatDateHeader = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (viewMode === 'week') {
      const start = viewDates[0];
      const end = viewDates[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            Shift Scheduler
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[200px] text-center text-sm font-medium text-white">
              {formatDateHeader()}
            </div>
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Create Shift Button */}
          {!readonly && (
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Shift
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {viewDates.map((date, idx) => (
            <div
              key={idx}
              className="px-4 py-3 text-center border-r border-white/10 last:border-r-0"
            >
              <div className="text-xs font-semibold text-zinc-400 uppercase">
                {DAYS_OF_WEEK[date.getDay()]}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                date.toDateString() === new Date().toDateString()
                  ? 'text-blue-400'
                  : 'text-white'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Shifts Grid */}
        <div className="grid grid-cols-7">
          {viewDates.map((date, idx) => {
            const dayShifts = getShiftsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`min-h-[200px] p-2 border-r border-white/10 last:border-r-0 ${
                  isToday ? 'bg-blue-500/5' : ''
                }`}
              >
                {/* Shifts for this day */}
                <div className="space-y-2">
                  {dayShifts.map(shift => (
                    <button
                      key={shift.id}
                      onClick={() => {
                        if (!readonly) {
                          setSelectedShift(shift);
                        }
                      }}
                      className={`w-full p-2 rounded-lg text-left transition-all ${
                        shift.status === 'scheduled'
                          ? 'bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30'
                          : shift.status === 'active'
                          ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30'
                          : shift.status === 'completed'
                          ? 'bg-zinc-500/20 border border-zinc-500/50'
                          : 'bg-red-500/20 border border-red-500/50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-white truncate">
                        {shift.staffName}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc-300">
                        <Clock className="h-3 w-3" />
                        {shift.shiftStartTime} - {shift.shiftEndTime}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 truncate">
                        {formatGateLocation(shift.assignedGate)}
                      </div>
                    </button>
                  ))}

                  {/* Add Shift Button */}
                  {!readonly && dayShifts.length === 0 && (
                    <button
                      onClick={() => {
                        setSelectedDate(date.toISOString().split('T')[0]);
                        setShowCreateModal(true);
                      }}
                      className="w-full p-4 rounded-lg border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-zinc-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-xs font-medium">Add Shift</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4">
        <div className="text-xs font-semibold text-zinc-400 uppercase">Status:</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/50" />
          <span className="text-xs text-zinc-400">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/50" />
          <span className="text-xs text-zinc-400">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-zinc-500/50" />
          <span className="text-xs text-zinc-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/50" />
          <span className="text-xs text-zinc-400">Missed/Cancelled</span>
        </div>
      </div>

      {/* Create/Edit Shift Modal */}
      {(showCreateModal || selectedShift) && (
        <ShiftModal
          shift={selectedShift}
          initialDate={selectedDate || undefined}
          availableStaff={availableStaff}
          onSave={(shiftData) => {
            if (selectedShift) {
              onUpdateShift(selectedShift.id, shiftData);
            } else {
              onCreateShift(shiftData);
            }
            setShowCreateModal(false);
            setSelectedShift(null);
            setSelectedDate(null);
          }}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedShift(null);
            setSelectedDate(null);
          }}
          onDelete={selectedShift ? () => {
            onDeleteShift(selectedShift.id);
            setSelectedShift(null);
          } : undefined}
          checkConflict={hasConflict}
        />
      )}
    </div>
  );
}

// Shift Modal Component
interface ShiftModalProps {
  shift?: ShiftAssignment | null;
  initialDate?: string;
  availableStaff: Array<{ id: string; firstName: string; lastName: string; role: SecurityRole }>;
  onSave: (data: any) => void;
  onClose: () => void;
  onDelete?: () => void;
  checkConflict: (date: string, startTime: string, endTime: string, staffId: string, excludeShiftId?: string) => boolean;
}

function ShiftModal({ shift, initialDate, availableStaff, onSave, onClose, onDelete, checkConflict }: ShiftModalProps) {
  const [staffId, setStaffId] = useState(shift?.securityStaffId || '');
  const [date, setDate] = useState(shift?.shiftDate || initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(shift?.shiftStartTime || '09:00');
  const [endTime, setEndTime] = useState(shift?.shiftEndTime || '17:00');
  const [gate, setGate] = useState<GateLocation>(shift?.assignedGate || 'main_gate');
  const [requiresHandover, setRequiresHandover] = useState(shift?.requiresHandover || false);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validation
    if (!staffId) {
      setError('Please select a staff member');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    // Check for conflicts
    if (checkConflict(date, startTime, endTime, staffId, shift?.id)) {
      setError('This staff member already has a shift at this time');
      return;
    }

    const selectedStaff = availableStaff.find(s => s.id === staffId);
    if (!selectedStaff) {
      setError('Invalid staff selection');
      return;
    }

    onSave({
      staffId,
      staffName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
      date,
      startTime,
      endTime,
      gate,
      requiresHandover,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {shift ? 'Edit Shift' : 'Create Shift'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Staff Member</label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select staff member...</option>
              {availableStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName} - {staff.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setError('');
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setError('');
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Gate */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Gate Assignment</label>
            <select
              value={gate}
              onChange={(e) => setGate(e.target.value as GateLocation)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="main_gate">Main Gate</option>
              <option value="side_gate">Side Gate</option>
              <option value="back_gate">Back Gate</option>
              <option value="parking_gate">Parking Gate</option>
            </select>
          </div>

          {/* Requires Handover */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="handover"
              checked={requiresHandover}
              onChange={(e) => setRequiresHandover(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="handover" className="text-sm text-white">
              Requires handover notes
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="h-5 w-5" />
            {shift ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
