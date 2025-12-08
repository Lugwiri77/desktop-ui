'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useEffect, useState } from 'react';

export function NetworkStatusIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner immediately
      setShowBanner(true);
      setJustReconnected(false);
    } else if (wasOffline) {
      // Just reconnected - show success banner briefly
      setJustReconnected(true);
      setShowBanner(true);

      // Hide success banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all ${
        justReconnected
          ? 'bg-green-600 text-white'
          : 'bg-amber-600 text-white'
      }`}
      role="alert"
    >
      {justReconnected ? (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back online - syncing data...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>You're offline - Changes will sync when reconnected</span>
        </div>
      )}
    </div>
  );
}

/**
 * Inline status badge (for use in components)
 */
export function NetworkStatusBadge() {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
      />
      <span className="text-xs text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
