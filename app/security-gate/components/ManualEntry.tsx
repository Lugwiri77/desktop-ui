'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  Check,
  AlertCircle,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Car,
} from 'lucide-react';
import {
  lookupVisitorByIdOrPhone,
  registerWalkInVisitor,
  checkInReturningVisitor,
  checkOutVisitor,
  type VisitorProfile,
  type VehicleInfo,
  type GateLocation,
} from '@/lib/visitor-manual-entry-api';

interface ManualEntryProps {
  onEntrySuccess?: () => void;
}

interface VisitorData {
  id?: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  purposeOfVisit?: string;
  personToVisit?: string;
  hasVehicle?: boolean;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  parkingSlot?: string;
}

export default function ManualEntry({ onEntrySuccess }: ManualEntryProps) {
  const [mode, setMode] = useState<'entry' | 'exit'>('entry');
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundVisitor, setFoundVisitor] = useState<VisitorData | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<VisitorData>({
    firstName: '',
    lastName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    company: '',
    purposeOfVisit: '',
    personToVisit: '',
    hasVehicle: false,
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    parkingSlot: '',
  });

  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    visitorName?: string;
    time?: string;
  } | null>(null);

  // Quick lookup for returning visitors
  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsLookingUp(true);
    try {
      const profile = await lookupVisitorByIdOrPhone(lookupQuery.trim());

      if (profile) {
        // Visitor found - parse name and populate data
        const nameParts = profile.visitorFullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFoundVisitor({
          firstName,
          lastName,
          idNumber: profile.visitorIdNumber || '',
          phoneNumber: profile.visitorPhoneNumber,
          email: profile.visitorEmail,
          company: profile.visitorOrganization,
          purposeOfVisit: profile.lastPurpose,
          personToVisit: '',
        });
        setShowForm(false);
      } else {
        // No visitor found, show new registration form
        setFoundVisitor(null);
        setShowForm(true);
        setFormData(prev => ({
          ...prev,
          idNumber: lookupQuery.length > 5 ? lookupQuery : '',
          phoneNumber: lookupQuery.startsWith('+') || lookupQuery.startsWith('0') ? lookupQuery : '',
        }));
      }
    } catch (error: any) {
      console.error('Lookup error:', error);
      // On error, show new registration form
      setFoundVisitor(null);
      setShowForm(true);
      setFormData(prev => ({
        ...prev,
        idNumber: lookupQuery.length > 5 ? lookupQuery : '',
        phoneNumber: lookupQuery.startsWith('+') || lookupQuery.startsWith('0') ? lookupQuery : '',
      }));

      setLastResult({
        success: false,
        message: error.message || 'Failed to lookup visitor',
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setLastResult(null), 5000);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Process entry/exit for found visitor
  const handleQuickProcess = async () => {
    if (!foundVisitor) return;

    try {
      if (mode === 'entry') {
        // Check in returning visitor
        const vehicleInfo: VehicleInfo | undefined = foundVisitor.hasVehicle && foundVisitor.vehicleRegistration
          ? {
              vehicleRegistration: foundVisitor.vehicleRegistration,
              vehicleMake: foundVisitor.vehicleMake,
              vehicleModel: foundVisitor.vehicleModel,
              vehicleColor: foundVisitor.vehicleColor,
              parkingSlot: foundVisitor.parkingSlot,
            }
          : undefined;

        await checkInReturningVisitor({
          idNumber: foundVisitor.idNumber,
          phoneNumber: foundVisitor.phoneNumber,
          purposeOfVisit: foundVisitor.purposeOfVisit,
          personToVisit: foundVisitor.personToVisit,
          vehicleInfo,
        });
      } else {
        // Check out visitor - need visitor log ID
        if (!foundVisitor.id) {
          throw new Error('Visitor log ID is required for check-out');
        }
        await checkOutVisitor({
          visitorLogId: foundVisitor.id,
        });
      }

      setLastResult({
        success: true,
        message: mode === 'entry' ? 'Entry recorded successfully' : 'Exit recorded successfully',
        visitorName: `${foundVisitor.firstName} ${foundVisitor.lastName}`,
        time: new Date().toLocaleTimeString(),
      });

      // Reset
      setFoundVisitor(null);
      setLookupQuery('');
      onEntrySuccess?.();

      setTimeout(() => setLastResult(null), 3000);
    } catch (error: any) {
      console.error('Process error:', error);
      setLastResult({
        success: false,
        message: error.message || 'Operation failed',
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setLastResult(null), 5000);
    }
  };

  // Submit new visitor registration
  const handleNewVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.idNumber || !formData.phoneNumber) {
      setLastResult({
        success: false,
        message: 'Please fill in all required fields',
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setLastResult(null), 3000);
      return;
    }

    // Validate vehicle info if has vehicle
    if (formData.hasVehicle && !formData.vehicleRegistration) {
      setLastResult({
        success: false,
        message: 'Vehicle registration is required when vehicle checkbox is selected',
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setLastResult(null), 3000);
      return;
    }

    try {
      const vehicleInfo: VehicleInfo | undefined = formData.hasVehicle && formData.vehicleRegistration
        ? {
            vehicleRegistration: formData.vehicleRegistration,
            vehicleMake: formData.vehicleMake,
            vehicleModel: formData.vehicleModel,
            vehicleColor: formData.vehicleColor,
            parkingSlot: formData.parkingSlot,
          }
        : undefined;

      await registerWalkInVisitor({
        firstName: formData.firstName,
        lastName: formData.lastName,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        company: formData.company,
        purposeOfVisit: formData.purposeOfVisit,
        personToVisit: formData.personToVisit,
        vehicleInfo,
      });

      setLastResult({
        success: true,
        message: 'Visitor registered and checked in successfully',
        visitorName: `${formData.firstName} ${formData.lastName}`,
        time: new Date().toLocaleTimeString(),
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        idNumber: '',
        phoneNumber: '',
        email: '',
        company: '',
        purposeOfVisit: '',
        personToVisit: '',
        hasVehicle: false,
        vehicleRegistration: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleColor: '',
        parkingSlot: '',
      });
      setShowForm(false);
      setLookupQuery('');
      onEntrySuccess?.();

      setTimeout(() => setLastResult(null), 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setLastResult({
        success: false,
        message: error.message || 'Registration failed',
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setLastResult(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode('entry');
            setFoundVisitor(null);
            setShowForm(false);
          }}
          className={`flex-1 rounded-lg border px-6 py-4 text-sm font-medium transition-all ${
            mode === 'entry'
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            <span>Entry</span>
          </div>
        </button>
        <button
          onClick={() => {
            setMode('exit');
            setFoundVisitor(null);
            setShowForm(false);
          }}
          className={`flex-1 rounded-lg border px-6 py-4 text-sm font-medium transition-all ${
            mode === 'exit'
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            <span>Exit</span>
          </div>
        </button>
      </div>

      {/* Result Notification */}
      {lastResult && (
        <div
          className={`rounded-lg border p-4 ${
            lastResult.success
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-red-500/50 bg-red-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  lastResult.success ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {lastResult.message}
              </p>
              {lastResult.visitorName && (
                <p className="mt-1 text-sm text-zinc-300">
                  Visitor: {lastResult.visitorName}
                </p>
              )}
              {lastResult.time && (
                <p className="mt-1 text-xs text-zinc-400">Time: {lastResult.time}</p>
              )}
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Lookup Form */}
      {!foundVisitor && !showForm && (
        <form onSubmit={handleQuickLookup} className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Search className="h-10 w-10 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {mode === 'entry' ? 'Check In Visitor' : 'Check Out Visitor'}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Enter ID number or phone number to lookup visitor
                </p>
              </div>

              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="ID Number or Phone Number..."
                disabled={isLookingUp}
                autoFocus
              />

              {isLookingUp && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={!lookupQuery || isLookingUp}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3 font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium text-white transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>New Visitor</span>
              </div>
            </button>
          </div>
        </form>
      )}

      {/* Found Visitor Details */}
      {foundVisitor && !showForm && (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Visitor Found</h3>
                <p className="text-xl font-bold text-green-400 mt-2">
                  {foundVisitor.firstName} {foundVisitor.lastName}
                </p>
              </div>

              {/* Visitor Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-left mt-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-zinc-400">ID Number</p>
                  <p className="text-sm text-white font-medium mt-1">{foundVisitor.idNumber}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-zinc-400">Phone</p>
                  <p className="text-sm text-white font-medium mt-1">{foundVisitor.phoneNumber}</p>
                </div>
                {foundVisitor.email && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 col-span-2">
                    <p className="text-xs text-zinc-400">Email</p>
                    <p className="text-sm text-white font-medium mt-1">{foundVisitor.email}</p>
                  </div>
                )}
                {foundVisitor.company && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 col-span-2">
                    <p className="text-xs text-zinc-400">Company</p>
                    <p className="text-sm text-white font-medium mt-1">{foundVisitor.company}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleQuickProcess}
              className={`rounded-lg px-6 py-4 font-medium text-white transition-all ${
                mode === 'entry'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {mode === 'entry' ? 'Check In' : 'Check Out'}
            </button>
            <button
              onClick={() => {
                setFoundVisitor(null);
                setLookupQuery('');
              }}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-4 font-medium text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Visitor Registration Form */}
      {showForm && (
        <form onSubmit={handleNewVisitorSubmit} className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">New Visitor Registration</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    idNumber: '',
                    phoneNumber: '',
                    email: '',
                    company: '',
                    purposeOfVisit: '',
                    personToVisit: '',
                    hasVehicle: false,
                    vehicleRegistration: '',
                    vehicleMake: '',
                    vehicleModel: '',
                    vehicleColor: '',
                    parkingSlot: '',
                  });
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="John"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Doe"
                  required
                />
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  ID Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="12345678"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="+254712345678"
                  required
                />
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="john.doe@example.com"
                />
              </div>

              {/* Company */}
              <div className="col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Company/Organization</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Tech Corp"
                />
              </div>

              {/* Purpose of Visit */}
              <div className="col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Purpose of Visit</label>
                <input
                  type="text"
                  value={formData.purposeOfVisit}
                  onChange={(e) => setFormData({ ...formData, purposeOfVisit: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Meeting, Interview, Delivery, etc."
                />
              </div>

              {/* Person to Visit */}
              <div className="col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Person to Visit</label>
                <input
                  type="text"
                  value={formData.personToVisit}
                  onChange={(e) => setFormData({ ...formData, personToVisit: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Jane Smith, HR Department"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car className="h-5 w-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">Vehicle Information</h4>
            </div>

            {/* Has Vehicle Checkbox */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasVehicle}
                  onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-sm text-zinc-300">Visitor arrived with a vehicle</span>
              </label>
            </div>

            {formData.hasVehicle && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Vehicle Registration */}
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-2">
                    Vehicle Registration <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleRegistration}
                    onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    placeholder="KXX 123Y"
                    required={formData.hasVehicle}
                  />
                </div>

                {/* Vehicle Make */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Make</label>
                  <input
                    type="text"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Toyota"
                  />
                </div>

                {/* Vehicle Model */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Camry"
                  />
                </div>

                {/* Vehicle Color */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Color</label>
                  <input
                    type="text"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Silver"
                  />
                </div>

                {/* Parking Slot */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Parking Slot</label>
                  <input
                    type="text"
                    value={formData.parkingSlot}
                    onChange={(e) => setFormData({ ...formData, parkingSlot: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    placeholder="A12"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 hover:bg-green-700 px-6 py-4 font-medium text-white transition-all"
          >
            Register & Check In
          </button>
        </form>
      )}

      {/* Instructions */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-white mb-2">Instructions:</h4>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Search by ID or phone for returning visitors</li>
          <li>• Register new visitors with complete details</li>
          <li>• Include vehicle information if visitor arrives with car</li>
          <li>• Verify all information before check-in</li>
          <li>• Ensure valid ID is presented</li>
        </ul>
      </div>
    </div>
  );
}
