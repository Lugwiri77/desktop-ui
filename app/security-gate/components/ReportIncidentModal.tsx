'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, AlertTriangle, Check } from 'lucide-react';

// Types
type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ReportIncidentInput {
  incidentType: string;
  severity: IncidentSeverity;
  description: string;
  location: string;
  incidentTime?: string;
}

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// API function
async function reportIncident(input: ReportIncidentInput) {
  const mutation = `
    mutation ReportIncident($input: ReportIncidentInput!) {
      reportIncident(input: $input) {
        id
        incidentType
        severity
        description
        location
        reportedByStaffId
        incidentTime
        alertSent
        createdAt
      }
    }
  `;

  const { graphql } = await import('@/lib/graphql');
  const data = await graphql<{ reportIncident: any }>(mutation, { input });
  return data.reportIncident;
}

export default function ReportIncidentModal({
  isOpen,
  onClose,
  onSuccess,
}: ReportIncidentModalProps) {
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: reportIncident,
    onSuccess: (data) => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onSuccess?.();
        // Reset form
        setIncidentType('');
        setSeverity('medium');
        setDescription('');
        setLocation('');
      }, 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate({
      incidentType,
      severity,
      description,
      location,
    });
  };

  if (!isOpen) return null;

  const severityColors = {
    low: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    medium: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
    high: 'bg-orange-500/10 border-orange-500/50 text-orange-400',
    critical: 'bg-red-500/10 border-red-500/50 text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Report Security Incident</h2>
              <p className="text-sm text-zinc-400">Document security concerns or incidents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-400" />
              <div>
                <p className="font-medium text-green-400">Incident Reported Successfully</p>
                <p className="text-sm text-green-300">
                  {severity === 'critical' && 'Security managers have been alerted.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {reportMutation.error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              {reportMutation.error instanceof Error
                ? reportMutation.error.message
                : 'Failed to report incident'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Incident Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Incident Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              placeholder="e.g., Suspicious Activity, Unauthorized Entry, Safety Hazard"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Severity <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as IncidentSeverity[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    severity === level
                      ? severityColors[level]
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            {severity === 'critical' && (
              <p className="mt-2 text-xs text-red-400">
                Critical incidents will automatically alert security managers
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Gate, Parking Area, Building A"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the incident..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              disabled={reportMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportMutation.isPending || !incidentType || !description || !location}
              className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reportMutation.isPending ? 'Reporting...' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
