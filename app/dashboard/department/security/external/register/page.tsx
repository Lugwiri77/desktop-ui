'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus, AlertCircle, Check, Key, Copy, Eye, EyeOff } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Field, Label, Description } from '@/app/components/fieldset';
import { Divider } from '@/app/components/divider';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import { registerExternalSecurityStaff, RegisterExternalSecurityStaffInput } from '@/lib/external-security-registration-api';

// Type aliases for external security staff roles
type SecurityRole = 'SECURITY_GUARD' | 'TEAM_LEAD';
type GateLocation = 'MAIN_GATE' | 'SIDE_GATE' | 'STAFF_ENTRANCE' | 'VIP_ENTRANCE' | 'PARKING_ENTRANCE' | 'BACK_ENTRANCE';

export default function RegisterExternalStaffWithPasswordPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phoneNumber: '',
    idNumber: '',
    personalEmail: '',
    badgeNumber: '',
    securityCompanyId: '',
    reportsTo: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<SecurityRole>('SECURITY_GUARD');
  const [gate, setGate] = useState<GateLocation | undefined>();
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    // Check if user has access to Security Department
    if (info.staffRole !== 'DepartmentManager' || info.department !== 'Security') {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const generateStrongPassword = (length: number = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const isPasswordValid = (pwd: string) => {
    return pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pwd);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(16);
    setPassword(generated);
    setConfirmPassword(generated);
    setErrors((prev) => {
      const { password, confirmPassword, ...rest } = prev;
      return rest;
    });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy password');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.workEmail.trim()) {
      newErrors.workEmail = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid(password)) {
      newErrors.password = 'Password does not meet security requirements';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userInfo?.organizationName) {
      alert('Organization information not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate username from work email (part before @)
      const username = formData.workEmail.split('@')[0];

      // Organization info is automatically derived from the authenticated user by the backend
      await registerExternalSecurityStaff({
        companyId: formData.securityCompanyId || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        idNumber: formData.idNumber,
        workEmail: formData.workEmail,
        username,
        password,
        personalEmail: formData.personalEmail || undefined,
        role,
        badgeNumber: formData.badgeNumber,
        assignedGate: gate,
        profilePicUrl: profilePicUrl || undefined,
        videoUrl: videoUrl || undefined,
      });

      alert(`Staff member ${formData.firstName} ${formData.lastName} registered successfully!\n\nCredentials:\nEmail: ${formData.workEmail}\nPassword: ${password}`);
      router.push('/dashboard/department/security/external');
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(`Failed to register staff member: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);

  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Back Button */}
        <Button
          outline
          onClick={() => router.push('/dashboard/department/security/external')}
          className="group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to External Staff
        </Button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="h-8 w-8 text-green-600" />
            <Heading>Register External Security Staff</Heading>
          </div>
          <Text className="mt-2">
            Create account with non-resetable password
          </Text>
        </div>

        <Divider />

        {/* Password Warning Alert */}
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-1">Important: Password Management</p>
              <p className="text-red-800">
                The password you create for this external security staff member <strong>CANNOT be reset by them</strong>.
                Only department managers and administrators can reset passwords for external security staff.
                Please save this password securely and provide it to the staff member.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>First Name <span className="text-red-600">*</span></Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
              </Field>

              <Field>
                <Label>Last Name <span className="text-red-600">*</span></Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
              </Field>

              <Field>
                <Label>Work Email (Login Username) <span className="text-red-600">*</span></Label>
                <Input
                  type="email"
                  value={formData.workEmail}
                  onChange={(e) => handleInputChange('workEmail', e.target.value)}
                  className={errors.workEmail ? 'border-red-500' : ''}
                />
                {errors.workEmail && <p className="mt-1 text-xs text-red-600">{errors.workEmail}</p>}
              </Field>

              <Field>
                <Label>Personal Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                />
              </Field>

              <Field>
                <Label>Phone Number <span className="text-red-600">*</span></Label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
              </Field>

              <Field>
                <Label>ID Number <span className="text-red-600">*</span></Label>
                <Input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className={errors.idNumber ? 'border-red-500' : ''}
                />
                {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
              </Field>
            </div>
          </div>

          {/* Password Section - CRITICAL */}
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-600" />
              Create Password (Non-Resetable)
            </h2>

            <div className="space-y-4">
              {/* Generate Password Button */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200">
                <span className="text-sm text-zinc-700">Need a strong password?</span>
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  color="blue"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Strong Password
                </Button>
              </div>

              {/* Password Input */}
              <Field>
                <Label>Password <span className="text-red-600">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => {
                        const { password, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className={`flex-1 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    outline
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </Field>

              {/* Confirm Password */}
              <Field>
                <Label>Confirm Password <span className="text-red-600">*</span></Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => {
                      const { confirmPassword, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </Field>

              {/* Copy Password */}
              {password && isPasswordValid(password) && password === confirmPassword && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Password Ready to Copy:</span>
                    <Button
                      type="button"
                      onClick={handleCopyPassword}
                      color="green"
                      className="text-sm"
                    >
                      {passwordCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Password
                        </>
                      )}
                    </Button>
                  </div>
                  <code className="block text-sm font-mono text-green-900 bg-white px-3 py-2 rounded border border-green-200">
                    {showPassword ? password : '••••••••••••••••'}
                  </code>
                  <p className="mt-2 text-xs text-green-800">
                    Copy this password and provide it to the staff member securely. They cannot reset it themselves.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Role & Assignment */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Role & Assignment</h2>
            <div className="space-y-4">
              <Field>
                <Label>Security Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as SecurityRole)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="SECURITY_GUARD">Security Guard</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                </select>
                <Description>Only Security Guards and Team Leads can be registered by department managers</Description>
              </Field>

              <Field>
                <Label>Assigned Gate (Optional)</Label>
                <select
                  value={gate || ''}
                  onChange={(e) => setGate((e.target.value as GateLocation) || undefined)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">No Gate Assigned</option>
                  <option value="MAIN_GATE">Main Gate</option>
                  <option value="SIDE_GATE">Side Gate</option>
                  <option value="STAFF_ENTRANCE">Staff Entrance</option>
                  <option value="VIP_ENTRANCE">VIP Entrance</option>
                  <option value="PARKING_ENTRANCE">Parking Entrance</option>
                  <option value="BACK_ENTRANCE">Back Entrance</option>
                </select>
              </Field>

              <Field>
                <Label>Badge Number (Optional)</Label>
                <Input
                  type="text"
                  value={formData.badgeNumber}
                  onChange={(e) => handleInputChange('badgeNumber', e.target.value)}
                  placeholder="Auto-generated if not provided"
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              outline
              onClick={() => router.push('/dashboard/department/security/external')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              color="green"
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Register Staff Member
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </ApplicationLayout>
  );
}
