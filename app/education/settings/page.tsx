'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, UserInfo } from '@/lib/roles';
import InstitutionSettings from '../components/InstitutionSettings';

export default function EducationSettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Only administrators of educational institutions can access this
    if (
      !isAdministrator(info.userRole) ||
      (info.organizationType !== 'education' && info.organizationType !== 'institution')
    ) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!userInfo || loading) {
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
      <InstitutionSettings />
    </ApplicationLayout>
  );
}
