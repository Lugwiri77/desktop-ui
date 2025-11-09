'use client';

import { UserPlus, MapPin, FileText, Calendar, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../button';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Register External Staff',
      description: 'Add new security contractor',
      icon: UserPlus,
      color: 'green',
      onClick: () => router.push('/dashboard/department/security/external/register'),
    },
    {
      label: 'Assign Gate',
      description: 'Assign staff to gate location',
      icon: MapPin,
      color: 'blue',
      onClick: () => router.push('/dashboard/department/security/gates'),
    },
    {
      label: 'Create Shift',
      description: 'Schedule security shift',
      icon: Calendar,
      color: 'purple',
      onClick: () => router.push('/dashboard/department/security/shifts'),
    },
    {
      label: 'View Reports',
      description: 'Analytics and insights',
      icon: FileText,
      color: 'orange',
      onClick: () => router.push('/dashboard/department/security/reports'),
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <QuickActionCard key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

function QuickActionCard({ label, description, icon: Icon, color, onClick }: QuickActionCardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/50 hover:bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 text-orange-400',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border ${colorClasses} p-4 text-left transition-all hover:scale-105`}
    >
      <Icon className="h-6 w-6 mb-3" />
      <h3 className="font-semibold text-white text-sm mb-1">{label}</h3>
      <p className="text-xs text-zinc-400">{description}</p>
    </button>
  );
}
