'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApplicationLayout } from '../../../components/application-layout';
import { Heading } from '../../../components/heading';
import { Text } from '../../../components/text';
import { Button } from '../../../components/button';
import { Field, Label, FieldGroup } from '../../../components/fieldset';
import { Input } from '../../../components/input';
import { Select } from '../../../components/select';
import { isAuthenticated, get, put } from '@/lib/api';
import { getDepartments, type Department } from '@/lib/graphql';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

interface StaffMember {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  username: string;
  work_email: string;
  phone_number: string;
  designation?: string;
  department?: string; // Legacy field (free text)
  department_id?: string; // New RBAC field (references departments table)
  staff_type: string;
}

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    work_email: '',
    phone_number: '',
    designation: '',
    department: '', // Legacy field
    department_id: '', // New RBAC field
  });

  // Fetch departments using GraphQL
  const { data: departments, isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      return await getDepartments();
    },
    enabled: !!userInfo,
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
    fetchStaffDetails();
  }, [router, staffId]);

  const fetchStaffDetails = async () => {
    try {
      setFetchingData(true);
      const response = await get(`/auth/staff/${staffId}`);

      if (response.status === 'success' && response.staff) {
        const staff = response.staff;
        setStaffMember(staff);
        setFormData({
          first_name: staff.first_name,
          middle_name: staff.middle_name || '',
          last_name: staff.last_name,
          username: staff.username,
          work_email: staff.work_email,
          phone_number: staff.phone_number,
          designation: staff.designation || '',
          department: staff.department || '', // Legacy field
          department_id: staff.department_id || '', // New RBAC field
        });
      } else {
        setError('Staff member not found');
      }
    } catch (err: any) {
      console.error('Error fetching staff details:', err);
      setError(err.message || 'Failed to load staff details');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.username ||
        !formData.work_email || !formData.phone_number) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Only send fields that have changed
      const updateData: any = {};
      if (formData.first_name !== staffMember?.first_name) {
        updateData.first_name = formData.first_name;
      }
      if (formData.middle_name !== (staffMember?.middle_name || '')) {
        updateData.middle_name = formData.middle_name || null;
      }
      if (formData.last_name !== staffMember?.last_name) {
        updateData.last_name = formData.last_name;
      }
      if (formData.username !== staffMember?.username) {
        updateData.username = formData.username;
      }
      if (formData.work_email !== staffMember?.work_email) {
        updateData.work_email = formData.work_email;
      }
      if (formData.phone_number !== staffMember?.phone_number) {
        updateData.phone_number = formData.phone_number;
      }
      if (formData.designation !== (staffMember?.designation || '')) {
        updateData.designation = formData.designation || null;
      }
      if (formData.department !== (staffMember?.department || '')) {
        updateData.department = formData.department || null;
      }
      if (formData.department_id !== (staffMember?.department_id || '')) {
        updateData.department_id = formData.department_id || null;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No changes detected');
        setLoading(false);
        return;
      }

      const response = await put(`/auth/staff/${staffId}`, updateData);

      if (response.status === 'success') {
        setSuccess('Staff details updated successfully!');
        setTimeout(() => {
          router.push('/staff');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update staff details');
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update staff details');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm the new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const response = await put(`/auth/staff/${staffId}/reset-password`, {
        new_password: newPassword,
      });

      if (response.status === 'success') {
        setSuccess('Password reset successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordReset(false);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
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

  if (fetchingData) {
    return (
      <ApplicationLayout
        userInfo={{
          username: userInfo.username,
          email: userInfo.email,
          profilePicUrl: userInfo.profilePicUrl,
          logoUrl: userInfo.logoUrl,
          organizationName: userInfo.organizationName,
          accountType: userInfo.accountType,
          organizationType: userInfo.organizationType,
          isAdministrator: true,
        }}
        onLogout={handleLogout}
        roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
        isAdmin={true}
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-gray-600">Loading staff details...</div>
        </div>
      </ApplicationLayout>
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
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-4xl">
        <div className="mb-8">
          <Heading>Edit Staff Member</Heading>
          <Text className="mt-2">
            Update details for {staffMember?.first_name} {staffMember?.last_name}
            {staffMember?.staff_type === 'administrator' && (
              <span className="ml-2 text-sm text-amber-600 dark:text-amber-500">
                (Administrator)
              </span>
            )}
          </Text>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={2} className="mb-6">Personal Information</Heading>

            <FieldGroup>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <Label>First Name *</Label>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Middle Name</Label>
                  <Input
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </Field>

                <Field>
                  <Label>Last Name *</Label>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Label>Username *</Label>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={2} className="mb-6">Contact Information</Heading>

            <FieldGroup>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Employment Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={2} className="mb-6">Employment Information</Heading>

            <FieldGroup>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <Label>Designation</Label>
                  <Input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </Field>

                <Field>
                  <Label>Department</Label>
                  <Select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleSelectChange}
                    disabled={departmentsLoading}
                  >
                    <option value="">Select a department</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                        {dept.isDefault && ' (Default)'}
                      </option>
                    ))}
                  </Select>
                  {departmentsLoading && (
                    <Text className="text-xs mt-1 text-gray-500">Loading departments...</Text>
                  )}
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Password Reset Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Heading level={2}>Password Reset</Heading>
                <Text className="mt-1 text-sm">Reset this staff member's password</Text>
              </div>
              {!showPasswordReset && (
                <Button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  outline
                  className="text-sm"
                >
                  Reset Password
                </Button>
              )}
            </div>

            {showPasswordReset && (
              <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field>
                      <Label>New Password *</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                    </Field>

                    <Field>
                      <Label>Confirm Password *</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                      />
                    </Field>
                  </div>
                </FieldGroup>

                <div className="flex items-center gap-3 mt-4">
                  <Button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={resetPasswordLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {resetPasswordLoading ? 'Resetting...' : 'Confirm Password Reset'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    outline
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Updating...' : 'Update Staff Details'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/staff')}
              outline
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
