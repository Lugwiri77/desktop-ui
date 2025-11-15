'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Shield } from 'lucide-react';
import { createGate, getOrganizationLocations, type OrganizationLocation } from '@/lib/security-department-api';
import { GateLocation } from '@/lib/security-api';

interface CreateGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGateModal({ isOpen, onClose, onSuccess }: CreateGateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gate form state
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [gateName, setGateName] = useState('');
  const [gateType, setGateType] = useState<GateLocation>('main_gate');
  const [gateDescription, setGateDescription] = useState('');
  const [isMonitored, setIsMonitored] = useState(true);

  // Fetch locations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      const locs = await getOrganizationLocations();
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const handleCreateGate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createGate({
        locationId: selectedLocationId,
        gateCode,
        gateName,
        gateType: gateType.toUpperCase() as GateLocation, // Convert to uppercase for GraphQL enum
        description: gateDescription || undefined,
        isMonitored,
      });

      // Reset form
      setGateCode('');
      setGateName('');
      setGateDescription('');
      setIsMonitored(true);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create gate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const gateTypes: { value: GateLocation; label: string }[] = [
    { value: 'main_gate', label: 'Main Gate' },
    { value: 'side_gate', label: 'Side Gate' },
    { value: 'staff_entrance', label: 'Staff Entrance' },
    { value: 'vip_entrance', label: 'VIP Entrance' },
    { value: 'parking_entrance', label: 'Parking Entrance' },
    { value: 'back_entrance', label: 'Back Entrance' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Create New Gate</h2>
              <p className="text-sm text-zinc-600">Add a new security gate to an existing location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleCreateGate} className="space-y-4">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {locations.length === 0 ? (
                  <option value="">No locations available</option>
                ) : (
                  locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.locationName} ({loc.locationCode})
                    </option>
                  ))
                )}
              </select>
              {locations.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Contact your organization administrator to create locations first
                </p>
              )}
            </div>

            {/* Gate Code */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Gate Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder="e.g., MAIN-01, SIDE-02"
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Gate Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Gate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                placeholder="e.g., Main Gate, North Entrance"
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Gate Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Gate Type <span className="text-red-500">*</span>
              </label>
              <select
                value={gateType}
                onChange={(e) => setGateType(e.target.value as GateLocation)}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {gateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Description
              </label>
              <textarea
                value={gateDescription}
                onChange={(e) => setGateDescription(e.target.value)}
                placeholder="Optional description of the gate"
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Is Monitored */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isMonitored"
                checked={isMonitored}
                onChange={(e) => setIsMonitored(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <label htmlFor="isMonitored" className="text-sm font-medium text-zinc-700">
                Enable monitoring for this gate
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-300 px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || locations.length === 0}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Gate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
