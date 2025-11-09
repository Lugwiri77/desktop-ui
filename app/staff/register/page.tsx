'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../../components/application-layout';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import { Field, Label } from '../../components/fieldset';
import { Input } from '../../components/input';
import { isAuthenticated, post } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

export default function RegisterStaffPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    title: '',
    date_of_birth: '',
    gender: '',
    username: '',
    work_email: '',
    personal_email: '',
    phone_number: '',
    country_code: 'KE',
    designation: '',
    department: '',
    tax_number: '',
    employment_number: '',
    employment_date: '',
    employment_term: '',
    job_group: '',
    password: '',
    confirm_password: '',
  });

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

    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await post('/auth/register_organization_staff', {
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        title: formData.title || null,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        username: formData.username,
        work_email: formData.work_email,
        personal_email: formData.personal_email,
        phone_number: formData.phone_number,
        country_code: formData.country_code,
        designation: formData.designation || null,
        department: formData.department || null,
        tax_number: formData.tax_number || null,
        employment_number: formData.employment_number || null,
        employment_date: formData.employment_date || null,
        employment_term: formData.employment_term || null,
        job_group: formData.job_group || null,
        password: formData.password,
        roles: {},
        permissions: {},
        address_components: null,
      });

      setSuccess('Staff member registered successfully!');
      setTimeout(() => {
        router.push('/staff');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
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
      <div className="max-w-4xl space-y-6">
        <div>
          <Heading>Register New Staff</Heading>
          <Text className="mt-2">Add a new staff member to your organization</Text>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                <Field>
                  <Label>Title</Label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Mr., Mrs., Dr."
                  />
                </Field>

                <Field>
                  <Label>First Name *</Label>
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Middle Name</Label>
                  <Input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </Field>

                <Field>
                  <Label>Last Name *</Label>
                  <Input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                <Field>
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Gender *</Label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange as any}
                    required
                    className="block w-full rounded-lg border border-zinc-950/10 px-3 py-2 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <Label>Username *</Label>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    placeholder="712345678"
                  />
                </Field>

                <Field>
                  <Label>Work Email *</Label>
                  <Input
                    type="email"
                    name="work_email"
                    value={formData.work_email}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Personal Email *</Label>
                  <Input
                    type="email"
                    name="personal_email"
                    value={formData.personal_email}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Employment Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <Label>Designation</Label>
                  <Input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g., Manager, Developer"
                  />
                </Field>

                <Field>
                  <Label>Department</Label>
                  <Input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., IT, Sales"
                  />
                </Field>

                <Field>
                  <Label>Employment Number</Label>
                  <Input
                    type="text"
                    name="employment_number"
                    value={formData.employment_number}
                    onChange={handleChange}
                    placeholder="e.g., EMP001"
                  />
                </Field>

                <Field>
                  <Label>Job Group</Label>
                  <Input
                    type="text"
                    name="job_group"
                    value={formData.job_group}
                    onChange={handleChange}
                    placeholder="e.g., A, B, C"
                  />
                </Field>

                <Field>
                  <Label>Employment Date</Label>
                  <Input
                    type="date"
                    name="employment_date"
                    value={formData.employment_date}
                    onChange={handleChange}
                  />
                </Field>

                <Field>
                  <Label>Employment Term</Label>
                  <select
                    name="employment_term"
                    value={formData.employment_term}
                    onChange={handleChange as any}
                    className="block w-full rounded-lg border border-zinc-950/10 px-3 py-2 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">Select Employment Term</option>
                    <option value="PermanentAndPensionable">Permanent & Pensionable</option>
                    <option value="FixedTerm">Fixed Term</option>
                    <option value="FullTimeContract">Full Time Contract</option>
                    <option value="PartTimeContract">Part Time Contract</option>
                    <option value="Casual">Casual</option>
                  </select>
                </Field>

                <Field>
                  <Label>Tax Number</Label>
                  <Input
                    type="text"
                    name="tax_number"
                    value={formData.tax_number}
                    onChange={handleChange}
                    placeholder="e.g., KRA PIN"
                  />
                </Field>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">Security</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </Field>

                <Field>
                  <Label>Confirm Password *</Label>
                  <Input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Staff'}
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/staff')}
                className="bg-zinc-500 hover:bg-zinc-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
