'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../components/application-layout';
import { loadUserInfo, isEducationInstitution, isAdministrator, getUserRoleDisplayName, UserInfo } from '@/lib/roles';
import dynamic from 'next/dynamic';

// Dynamically import StudentManagementSection to avoid SSR issues
const StudentManagementSection = dynamic(
  () => import('../components/institution/StudentManagementSection'),
  { ssr: false }
);

export default function StudentManagementPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const info = loadUserInfo();
        if (!info) {
          router.push('/login');
          return;
        }

        // Check if user is from an educational institution
        if (!isEducationInstitution(info.accountType, info.organizationType)) {
          router.push('/dashboard');
          return;
        }

        setUserInfo(info);
      } catch (error) {
        console.error('Failed to load user info:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading || !userInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentManagementSection
          institutionId={userInfo.organizationId || ''}
          organizationType={userInfo.organizationType}
        />
      </div>
    </ApplicationLayout>
  );
}
