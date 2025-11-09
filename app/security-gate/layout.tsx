'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';
import { Bell, LogOut, Shield } from 'lucide-react';

interface SecurityStaffInfo {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  securityRole: 'security_manager' | 'team_lead' | 'security_guard';
  assignedGate?: string;
  profilePicUrl?: string;
}

export default function SecurityGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [staffInfo, setStaffInfo] = useState<SecurityStaffInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Load security staff info from localStorage
    const info = localStorage.getItem('security_staff_info');
    if (info) {
      setStaffInfo(JSON.parse(info));
    }

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = async () => {
    // Call logout API
    try {
      const { logout } = await import('@/lib/api');
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    router.push('/login');
  };

  if (!staffInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'security_manager':
        return (
          <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400">
            Manager
          </span>
        );
      case 'team_lead':
        return (
          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
            Team Lead
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
            Guard
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-900/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left: Logo & Gate Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">
                Security Gate
              </span>
            </div>
            {staffInfo.assignedGate && (
              <div className="hidden sm:block rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                {staffInfo.assignedGate.replace(/_/g, ' ').toUpperCase()}
              </div>
            )}
          </div>

          {/* Center: Clock */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </div>
            <div className="text-xs text-zinc-400">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          {/* Right: User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {staffInfo.firstName} {staffInfo.lastName}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-zinc-400">
                    #{staffInfo.badgeNumber}
                  </span>
                  {getRoleBadge(staffInfo.securityRole)}
                </div>
              </div>
              {staffInfo.profilePicUrl ? (
                <img
                  src={staffInfo.profilePicUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border-2 border-white/10"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-white/10 bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {staffInfo.firstName[0]}{staffInfo.lastName[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Emergency Button (Fixed Position) */}
      <button className="fixed bottom-6 right-6 z-50 rounded-full bg-red-600 p-4 text-white shadow-lg hover:bg-red-700 active:scale-95 transition-all">
        <Bell className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </button>
    </div>
  );
}
