'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Search } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Field, Label } from '@/app/components/fieldset';
import { Divider } from '@/app/components/divider';
import { Badge } from '@/app/components/badge';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

export default function InternalStaffPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sample data - will be replaced with API call
  const internalStaff = [
    { id: '1', fullName: 'John Doe', email: 'john@example.com', role: 'Security Officer', status: 'Active' },
    { id: '2', fullName: 'Jane Smith', email: 'jane@example.com', role: 'Senior Security', status: 'Active' },
  ];

  const filteredStaff = internalStaff.filter(
    (staff) =>
      staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          outline
          onClick={() => router.push('/dashboard/department/security')}
          className="group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <Heading>Internal Security Staff</Heading>
          </div>
          <Text className="mt-2">
            View and manage internal security department staff members
          </Text>
        </div>

        <Divider />

        {/* Search */}
        <Field>
          <Label>Search Staff</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
        </Field>

        {/* Staff List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text>
              <strong>{filteredStaff.length}</strong> staff members
            </Text>
            <Button color="blue">Add New Staff</Button>
          </div>

          <div className="rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 divide-y divide-zinc-950/5">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <div key={staff.id} className="p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900">{staff.fullName}</h3>
                      <p className="text-sm text-zinc-600 mt-1">{staff.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="blue">{staff.role}</Badge>
                        <Badge color="green">{staff.status}</Badge>
                      </div>
                    </div>
                    <Button outline>View Details</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <Text className="text-zinc-500">
                  {searchQuery
                    ? 'No staff members match your search.'
                    : 'No internal security staff found.'}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Backend Integration Note */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Backend integration in progress.</strong> This page will display real staff data once connected to the API.
          </p>
        </div>
      </div>
    </ApplicationLayout>
  );
}
