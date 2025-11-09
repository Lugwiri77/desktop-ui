'use client';

import { MapPin, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSecurityDepartmentOverview } from '@/hooks/use-security-department';
import { formatGateLocation } from '@/lib/security-department-api';

export function GateStatus() {
  const { data: overview, isLoading } = useSecurityDepartmentOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 p-4 animate-pulse">
            <div className="h-24 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const gates = overview?.gateCoverage || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Gate Coverage</h2>
        <div className="text-sm text-zinc-400">
          {gates.filter((g) => g.covered).length} of {gates.length} gates manned
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gates.map((gate) => (
          <GateCard key={gate.gate} gate={gate} />
        ))}
      </div>
    </div>
  );
}

interface GateCardProps {
  gate: {
    gate: string;
    gateName: string;
    covered: boolean;
    staffName?: string;
    staffBadgeNumber?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
  };
}

function GateCard({ gate }: GateCardProps) {
  const statusColor = gate.covered
    ? 'border-green-500/50 bg-green-500/10'
    : 'border-red-500/50 bg-red-500/10';

  return (
    <div className={`rounded-xl border ${statusColor} p-4 hover:shadow-lg transition-all`}>
      {/* Gate Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className={`h-5 w-5 ${gate.covered ? 'text-green-400' : 'text-red-400'}`} />
          <h3 className="font-semibold text-white">{gate.gateName}</h3>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            gate.covered
              ? 'bg-green-500/20 text-green-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {gate.covered ? 'MANNED' : 'VACANT'}
        </div>
      </div>

      {/* Staff Assignment */}
      {gate.covered && gate.staffName ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300">{gate.staffName}</span>
          </div>
          {gate.staffBadgeNumber && (
            <div className="text-xs text-zinc-400">Badge: {gate.staffBadgeNumber}</div>
          )}
          {gate.shiftStartTime && gate.shiftEndTime && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              <span>
                {gate.shiftStartTime} - {gate.shiftEndTime}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-zinc-400 italic">No staff assigned</div>
      )}

      {/* Status Icon */}
      <div className="mt-3 pt-3 border-t border-white/10">
        {gate.covered ? (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <XCircle className="h-4 w-4" />
            <span>Needs Coverage</span>
          </div>
        )}
      </div>
    </div>
  );
}
