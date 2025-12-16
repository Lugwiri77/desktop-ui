'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  isStaff,
  getUserRoleDisplayName,
  getAccountTypeDisplayName,
  isAllowedUser,
  UserInfo,
  AccountType,
} from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Badge } from '../components/badge';
import { SearchButton } from '../components/search-button';
import { graphql } from '@/lib/graphql';

interface InstitutionStatistics {
  totalStudents: number;
  studentsCheckedIn: number;
  pendingApprovals: number;
  todaysActivities: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [statistics, setStatistics] = useState<InstitutionStatistics>({
    totalStudents: 0,
    studentsCheckedIn: 0,
    pendingApprovals: 0,
    todaysActivities: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Load user info
    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    // Double-check that user is allowed (Business or Institution)
    if (!isAllowedUser(info.userRole)) {
      localStorage.clear();
      router.push('/login');
      return;
    }

    // Redirect department managers to their department-specific dashboard
    if (info.staffRole === 'DepartmentManager' && info.department) {
      const departmentRoute = info.department.toLowerCase().replace(/\s+/g, '-');
      router.push(`/dashboard/department/${departmentRoute}`);
      return;
    }

    setUserInfo(info);
  }, [router]);

  // Load statistics for educational institutions
  useEffect(() => {
    const loadStatistics = async () => {
      if (!userInfo || !userInfo.organizationId || userInfo.organizationType !== 'EducationalInstitution') {
        return;
      }

      setLoadingStats(true);
      try {
        const query = `
          query GetInstitutionStatistics($institutionId: String!) {
            getInstitutionStatistics(institutionId: $institutionId) {
              totalStudents
              studentsCheckedIn
              pendingApprovals
              todaysActivities
            }
          }
        `;

        const result = await graphql<{ getInstitutionStatistics: InstitutionStatistics }>(query, {
          institutionId: userInfo.organizationId,
        });

        if (result.getInstitutionStatistics) {
          setStatistics(result.getInstitutionStatistics);
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
        // Keep default zero values on error
      } finally {
        setLoadingStats(false);
      }
    };

    loadStatistics();
  }, [userInfo]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local storage anyway and redirect
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
  const accountTypeDisplay = getAccountTypeDisplayName(userInfo.accountType);

  // Create layout user info with all required fields including subcategories
  const layoutUserInfo = createLayoutUserInfo(userInfo);

  // Get institution subcategory for educational institutions
  const educationalSubcategory = localStorage.getItem('educational_institution_subcategory') || '';
  const isEducationalInstitution = userInfo.organizationType === 'EducationalInstitution';
  const isUniversity = educationalSubcategory === 'University' || educationalSubcategory === 'College';
  const isPrimarySecondary = ['PrimarySchool', 'SecondarySchool', 'LanguageSchool'].includes(educationalSubcategory);

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        {/* Administrator View */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Stats Cards - Educational Institutions */}
            {isEducationalInstitution ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-blue-600 p-6 text-white shadow-sm">
                  <Text className="text-sm text-blue-100">Total Students</Text>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">
                      {loadingStats ? '...' : statistics.totalStudents}
                    </span>
                  </div>
                  <Text className="mt-1 text-xs text-blue-100">Registered students</Text>
                </div>

                <div className="rounded-lg bg-green-600 p-6 text-white shadow-sm">
                  <Text className="text-sm text-green-100">Active Today</Text>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">
                      {loadingStats ? '...' : statistics.studentsCheckedIn}
                    </span>
                  </div>
                  <Text className="mt-1 text-xs text-green-100">Checked in students</Text>
                </div>

                <div className="rounded-lg bg-yellow-600 p-6 text-white shadow-sm">
                  <Text className="text-sm text-yellow-100">Pending Approvals</Text>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">
                      {loadingStats ? '...' : statistics.pendingApprovals}
                    </span>
                  </div>
                  <Text className="mt-1 text-xs text-yellow-100">
                    {isPrimarySecondary ? 'Pickup requests' : 'Student approvals'}
                  </Text>
                </div>

                <div className="rounded-lg bg-purple-600 p-6 text-white shadow-sm">
                  <Text className="text-sm text-purple-100">Today's Activities</Text>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">
                      {loadingStats ? '...' : statistics.todaysActivities}
                    </span>
                  </div>
                  <Text className="mt-1 text-xs text-purple-100">Check-ins/check-outs</Text>
                </div>
              </div>
            ) : (
              /* Generic Stats for Non-Educational Institutions */
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Staff</Text>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                    <Badge color="blue">New</Badge>
                  </div>
                  <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Registered users</Text>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Active Sessions</Text>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                    <Badge color="green">Live</Badge>
                  </div>
                  <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Currently online</Text>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Departments</Text>
                  <div className="mt-2">
                    <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                  </div>
                  <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Organization units</Text>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Revenue</Text>
                  <div className="mt-2">
                    <span className="text-3xl font-semibold text-zinc-950 dark:text-white">$0</span>
                  </div>
                  <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Financial overview</Text>
                </div>
              </div>
            )}

            {/* Educational Institution Type Notice */}
            {isEducationalInstitution && educationalSubcategory && (
              <div className="rounded-lg bg-blue-50 p-6 ring-1 ring-blue-200 dark:bg-blue-950/10 dark:ring-blue-900">
                <div className="flex items-start gap-3">
                  <svg
                    className="size-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  <div>
                    <Text className="font-semibold text-blue-900 dark:text-blue-100">
                      {educationalSubcategory === 'PrimarySchool' && 'Primary School Features Active'}
                      {educationalSubcategory === 'SecondarySchool' && 'Secondary School Features Active'}
                      {(educationalSubcategory === 'University' || educationalSubcategory === 'College') && 'University/College Features Active'}
                      {educationalSubcategory === 'VocationalSchool' && 'Vocational School Features Active'}
                      {educationalSubcategory === 'SpecialEducation' && 'Special Education Features Active'}
                      {educationalSubcategory === 'OnlineLearningPlatform' && 'Online Learning Features Active'}
                    </Text>
                    <Text className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                      {isUniversity
                        ? 'Students register with Next of Kin (emergency contact only). No pickup/dropoff system.'
                        : 'Students register with Guardians who receive app access via email matching. Pickup/dropoff approval system enabled.'}
                    </Text>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Staff View */}
        {isStaff(userInfo.userRole) && (
          <div className="space-y-6">
            {/* Limited Stats for Staff */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">My Tasks</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pending assignments</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Completed</Text>
                <div className="mt-2">
                  <span className="text-3xl font-semibold text-zinc-950 dark:text-white">0</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tasks finished</Text>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">My Department</Text>
                <div className="mt-2">
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">N/A</span>
                </div>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Current assignment</Text>
              </div>
            </div>

            {/* Staff Actions */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <Heading level={2} className="mb-4">My Actions</Heading>
              <div className="grid gap-4 sm:grid-cols-2">
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">View My Tasks</div>
                  <Text className="mt-1 text-sm">See assigned tasks and deadlines</Text>
                </button>
                <button className="rounded-lg border border-zinc-200 p-4 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="font-semibold text-zinc-950 dark:text-white">Submit Report</div>
                  <Text className="mt-1 text-sm">Upload task completion reports</Text>
                </button>
              </div>
            </div>

            {/* Permission Notice */}
            <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/10 dark:ring-amber-900">
              <Text className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Some features are restricted based on your role and permissions.
                Contact your administrator for access to additional features.
              </Text>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <Heading level={2} className="mb-4">
            Welcome to {accountTypeDisplay} Desktop Application
          </Heading>
          <Text className="mb-4">
            You are logged in as <strong>{roleDisplayName}</strong>. This dashboard is customized
            based on your role and permissions within the organization.
          </Text>
          <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200 dark:bg-blue-950/10 dark:ring-blue-900">
            <Text className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Account Type:</strong> {accountTypeDisplay}
              {userInfo.organizationType && (
                <>
                  {' '}
                  | <strong>Category:</strong> {userInfo.organizationType}
                </>
              )}
            </Text>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
