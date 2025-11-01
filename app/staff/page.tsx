'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Button } from '../components/button';
import { Avatar } from '../components/avatar';
import { Badge } from '../components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/table';
import { isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import { PlusIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useStaffList } from '@/lib/hooks/use-cached-api';

interface StaffMember {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  username: string;
  work_email: string;
  phone_number: string;
  designation?: string;
  department?: string;
  employment_date?: string;
  is_active: boolean;
  profile_pic_url?: string;
  staff_type: 'administrator' | 'staff';
}

export default function StaffPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Use cached staff list hook - automatically handles caching and background refetch
  const { data: staffData, isLoading, isError, error: apiError, refetch, isFetching } = useStaffList();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    // Only administrators can access this page
    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const staff = staffData?.staff || [];
  const error = isError ? (apiError as Error).message : '';

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
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heading>Staff Management</Heading>
            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetch()}
              outline
              disabled={isFetching}
            >
              <ArrowPathIcon className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => router.push('/staff/register')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Register New Staff
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-gray-600">Loading staff...</div>
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <p className="text-zinc-500 dark:text-zinc-400">
              No staff members found. Click "Register New Staff" to add staff members.
            </p>
          </div>
        ) : (
          <div className="rounded-lg px-2.5 bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Table className="[--gutter:--spacing(6)] sm:[--gutter:--spacing(8)]">
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={member.profile_pic_url}
                          initials={`${member.first_name.charAt(0)}${member.last_name.charAt(0)}`}
                          className="size-12"
                        />
                        <div>
                          <div className="font-medium text-zinc-950 dark:text-white">
                            {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            @{member.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-zinc-950 dark:text-white">
                          {member.designation || 'N/A'}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {member.staff_type === 'administrator' ? 'Administrator' : 'Staff'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {member.department || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <a
                          href={`mailto:${member.work_email}`}
                          className="text-zinc-950 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-300"
                        >
                          {member.work_email}
                        </a>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          {member.phone_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge color="lime">Active</Badge>
                      ) : (
                        <Badge color="zinc">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => router.push(`/staff/${member.id}/edit`)}
                          outline
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        {member.staff_type === 'staff' && (
                          <Button
                            onClick={() => router.push(`/staff/${member.id}/roles`)}
                            className="text-xs"
                          >
                            Manage Roles
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && staff.length > 0 && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {staff.length} staff member{staff.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
