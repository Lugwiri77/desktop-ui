'use client';

import {
  type ApprovalMethod,
  getMethodIcon,
  getMethodText
} from '@/lib/real-estate-approval-api';
import {
  Smartphone,
  Mail,
  MessageSquare,
  Phone,
  Bell
} from 'lucide-react';

interface NotificationMethodIndicatorProps {
  method: ApprovalMethod;
  requiresOtp?: boolean;
  variant?: 'full' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationMethodIndicator({
  method,
  requiresOtp = false,
  variant = 'full',
  size = 'md'
}: NotificationMethodIndicatorProps) {
  const text = getMethodText(method);

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const getIcon = () => {
    const iconClass = iconSize;
    switch (method) {
      case 'push_notification':
        return <Smartphone className={iconClass} />;
      case 'email':
        return <Mail className={iconClass} />;
      case 'sms':
        return <MessageSquare className={iconClass} />;
      case 'phone_call':
        return <Phone className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getMethodColor = () => {
    switch (method) {
      case 'push_notification':
        return 'text-blue-400 bg-blue-500/10';
      case 'email':
        return 'text-purple-400 bg-purple-500/10';
      case 'sms':
        return 'text-green-400 bg-green-500/10';
      case 'phone_call':
        return 'text-orange-400 bg-orange-500/10';
      default:
        return 'text-zinc-400 bg-zinc-500/10';
    }
  };

  if (variant === 'icon-only') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg p-2 ${getMethodColor()}`}
        title={text}
      >
        {getIcon()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border border-white/10 ${getMethodColor()} px-3 py-1.5`}>
      {getIcon()}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{text}</span>
        {requiresOtp && (
          <span className="text-xs opacity-75">OTP Required</span>
        )}
      </div>
    </div>
  );
}
