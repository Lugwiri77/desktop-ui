import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
}

/**
 * Hook to detect online/offline status
 * Returns network status and provides event-based updates
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [effectiveType, setEffectiveType] = useState<string | undefined>();

  useEffect(() => {
    // Check if NetworkInformation API is available
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      setEffectiveType(connection.effectiveType);

      const handleConnectionChange = () => {
        setEffectiveType(connection.effectiveType);
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      setIsOnline(true);

      // If we were offline, trigger a notification
      if (wasOffline) {
        // You can add a toast notification here
        console.log('✅ Connection restored - syncing data...');
      }
    };

    const handleOffline = () => {
      console.log('📡 Network: Gone offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline, effectiveType };
}

/**
 * Hook to check if network is slow
 * Useful for adjusting UI based on connection quality
 */
export function useIsSlowNetwork(): boolean {
  const { effectiveType } = useNetworkStatus();
  return effectiveType === 'slow-2g' || effectiveType === '2g';
}

/**
 * Utility function to check online status synchronously
 */
export function checkOnlineStatus(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
