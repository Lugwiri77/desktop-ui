'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Shield, Building2 } from 'lucide-react';
import { createGate, createLocation, getOrganizationLocations, type SecurityGate, type OrganizationLocation } from '@/lib/security-department-api';
import { GateLocation } from '@/lib/security-api';

interface CreateGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'gate' | 'location';

export default function CreateGateModal({ isOpen, onClose, onSuccess }: CreateGateModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gate');
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

  // Location form state
  const [locationCode, setLocationCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState('branch');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newLocation = await createLocation({
        locationCode,
        locationName,
        locationType,
        addressLine1: addressLine1 || undefined,
        city: city || undefined,
        country: country || undefined,
        phoneNumber: phoneNumber || undefined,
      });

      // Reset form
      setLocationCode('');
      setLocationName('');
      setLocationType('branch');
      setAddressLine1('');
      setCity('');
      setCountry('');
      setPhoneNumber('');

      // Refresh locations and switch to gate tab
      await fetchLocations();
      setSelectedLocationId(newLocation.id);
      setActiveTab('gate');
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
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

  const locationTypes = [
    { value: 'headquarters', label: 'Headquarters' },
    { value: 'branch', label: 'Branch Office' },
    { value: 'main_campus', label: 'Main Campus' },
    { value: 'regional_office', label: 'Regional Office' },
    { value: 'satellite', label: 'Satellite Location' },
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
              <h2 className="text-xl font-semibold text-zinc-900">Gate Management</h2>
              <p className="text-sm text-zinc-600">Create new gates and locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab('gate')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'gate'
                ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Create Gate</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'location'
                ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Create Location</span>
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'gate' ? (
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
                    <option value="">No locations available - create one first</option>
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
                    Switch to the "Create Location" tab to add a location first
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
          ) : (
            <form onSubmit={handleCreateLocation} className="space-y-4">
              {/* Location Code */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Location Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value)}
                  placeholder="e.g., HQ, BR-01, REG-WEST"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Location Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Headquarters, North Branch"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Location Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {locationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* City and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
