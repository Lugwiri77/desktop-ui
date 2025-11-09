'use client';

import { MapPin, Check, Users, AlertCircle } from 'lucide-react';
import { GateLocation, formatGateLocation, getGateColor } from '@/lib/security-api';
import { useState } from 'react';

interface GateAssignmentProps {
  value?: GateLocation;
  onChange: (gate: GateLocation | undefined) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  showAvailability?: boolean;
  gateAvailability?: Record<GateLocation, { available: boolean; assignedStaff?: string[] }>;
  allowUnassigned?: boolean;
}

const GATES: { value: GateLocation; name: string; description: string }[] = [
  { value: 'main_gate', name: 'Main Gate', description: 'Primary entrance for visitors and staff' },
  { value: 'side_gate', name: 'Side Gate', description: 'Secondary entrance for deliveries' },
  { value: 'back_gate', name: 'Back Gate', description: 'Service entrance for maintenance' },
  { value: 'parking_gate', name: 'Parking Gate', description: 'Vehicle access control point' },
];

export function GateAssignment({
  value,
  onChange,
  disabled = false,
  label = 'Assigned Gate',
  error,
  showAvailability = false,
  gateAvailability = {},
  allowUnassigned = true,
}: GateAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getGateStatus = (gate: GateLocation) => {
    const availability = gateAvailability[gate];
    if (!availability) return { available: true, staffCount: 0 };
    return {
      available: availability.available,
      staffCount: availability.assignedStaff?.length || 0,
    };
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-white">
        {label}
        {disabled && (
          <span className="ml-2 text-xs text-zinc-500">(Read-only)</span>
        )}
      </label>

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
            disabled
              ? 'border-white/5 bg-white/5 text-zinc-500 cursor-not-allowed'
              : error
              ? 'border-red-500/50 bg-red-500/5 text-white hover:border-red-500'
              : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-sm font-medium">
                {value ? formatGateLocation(value) : 'No Gate Assigned'}
              </div>
              {value && showAvailability && (
                <div className="text-xs text-zinc-400 mt-0.5">
                  {getGateStatus(value).staffCount} staff assigned
                </div>
              )}
            </div>
          </div>
          {!disabled && (
            <svg
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute z-20 w-full mt-2 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden max-h-80 overflow-y-auto">
              {/* Unassigned Option */}
              {allowUnassigned && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    !value ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {!value ? (
                        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">No Gate Assigned</span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Staff member will not have a default gate
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Gate Options */}
              {GATES.map((gate) => {
                const isSelected = value === gate.value;
                const status = getGateStatus(gate.value);
                const color = getGateColor(gate.value);

                return (
                  <button
                    key={gate.value}
                    type="button"
                    onClick={() => {
                      onChange(gate.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      isSelected ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium text-${color}-400`}>
                            {gate.name}
                          </span>
                          {showAvailability && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                status.available
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-orange-500/10 text-orange-400'
                              }`}
                            >
                              {status.available ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Available
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3" />
                                  {status.staffCount} assigned
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{gate.description}</p>

                        {/* Staff Count */}
                        {showAvailability && status.staffCount > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                            <Users className="h-3 w-3" />
                            <span>{status.staffCount} staff currently assigned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Visual Gate Map (Optional) */}
      {value && !isOpen && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Gate Location
            </span>
          </div>
          <div className="relative h-32 rounded-lg bg-zinc-950 border border-white/10 overflow-hidden">
            {/* Simple visual representation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full bg-${getGateColor(value)}-500/20 border-2 border-${getGateColor(value)}-500 flex items-center justify-center`}>
                <MapPin className={`h-8 w-8 text-${getGateColor(value)}-400`} />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-xs text-center text-zinc-400 font-medium">
                {formatGateLocation(value)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
