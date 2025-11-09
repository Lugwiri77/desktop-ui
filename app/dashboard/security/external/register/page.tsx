'use client';

import { useState } from 'react';
import { ArrowLeft, UserPlus, Save, Upload, AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRegisterExternalStaff, useSecurityCompanies } from '@/hooks/use-security';
import { RoleSelector } from '@/app/components/security/RoleSelector';
import { GateAssignment } from '@/app/components/security/GateAssignment';
import { SecurityRole, GateLocation } from '@/lib/security-api';

export default function RegisterExternalStaffPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phoneNumber: '',
    idNumber: '',
    badgeNumber: '',
    securityCompanyId: '',
  });
  const [role, setRole] = useState<SecurityRole>('security_guard');
  const [gate, setGate] = useState<GateLocation | undefined>();
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: companies = [] } = useSecurityCompanies();
  const registerMutation = useRegisterExternalStaff();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.workEmail.trim()) {
      newErrors.workEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        ...formData,
        securityRole: role,
        assignedGate: gate,
        profilePicUrl: profilePicUrl || undefined,
        videoUrl: videoUrl || undefined,
        securityCompanyId: formData.securityCompanyId || undefined,
      });

      if (result.success) {
        alert('Staff member registered successfully!');
        router.push('/dashboard/security/external/staff');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register staff member. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-green-400" />
              Register External Security Staff
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manually register external security contractors
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Manual Registration</p>
            <p className="text-blue-300/80">
              Use this form to register external security staff who are not nominated by a security company.
              For company-nominated staff, use the Staff Approval workflow instead.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full rounded-lg border ${
                    errors.firstName ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'
                  } px-4 py-2 text-white focus:border-blue-500 focus:outline-none`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full rounded-lg border ${
                    errors.lastName ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'
                  } px-4 py-2 text-white focus:border-blue-500 focus:outline-none`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Work Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.workEmail}
                  onChange={(e) => handleInputChange('workEmail', e.target.value)}
                  className={`w-full rounded-lg border ${
                    errors.workEmail ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'
                  } px-4 py-2 text-white focus:border-blue-500 focus:outline-none`}
                />
                {errors.workEmail && (
                  <p className="mt-1 text-xs text-red-400">{errors.workEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full rounded-lg border ${
                    errors.phoneNumber ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'
                  } px-4 py-2 text-white focus:border-blue-500 focus:outline-none`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-400">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ID Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className={`w-full rounded-lg border ${
                    errors.idNumber ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'
                  } px-4 py-2 text-white focus:border-blue-500 focus:outline-none`}
                />
                {errors.idNumber && (
                  <p className="mt-1 text-xs text-red-400">{errors.idNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Badge Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.badgeNumber}
                  onChange={(e) => handleInputChange('badgeNumber', e.target.value)}
                  placeholder="Will be auto-generated if not provided"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Security Company */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Company Association (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Security Company
              </label>
              <select
                value={formData.securityCompanyId}
                onChange={(e) => handleInputChange('securityCompanyId', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">None - Independent Contractor</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400">
                Select a company if this staff member is affiliated with a registered security company
              </p>
            </div>
          </div>

          {/* Role & Assignment */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Role & Assignment</h2>
            <div className="space-y-6">
              <RoleSelector
                value={role}
                onChange={setRole}
                showPermissions={true}
              />

              <GateAssignment
                value={gate}
                onChange={setGate}
                allowUnassigned={true}
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Verification Media (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Verification Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-400">
                <p>Upload photos and videos to your preferred storage service and paste the URLs here.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex-1 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Registering...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Register Staff Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
