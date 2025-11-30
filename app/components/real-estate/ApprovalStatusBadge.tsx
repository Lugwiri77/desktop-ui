'use client';

import { Badge } from '../badge';
import {
  type ApprovalStatus,
  getStatusText,
  getStatusColor
} from '@/lib/real-estate-approval-api';
import { Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ApprovalStatusBadge({
  status,
  showIcon = true,
  size = 'md'
}: ApprovalStatusBadgeProps) {
  const color = getStatusColor(status);
  const text = getStatusText(status);

  const getIcon = () => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'expired':
        return <AlertCircle className="h-3 w-3" />;
      case 'cancelled':
        return <Ban className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge color={color}>
      <div className="flex items-center gap-1.5">
        {showIcon && getIcon()}
        <span>{text}</span>
      </div>
    </Badge>
  );
}
