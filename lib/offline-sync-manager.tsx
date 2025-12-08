'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { processQueue, getQueueStats } from './offline-queue';
import { useExecuteQueuedMutation } from './hooks/useOfflineMutation';
import { toast } from 'sonner';

/**
 * Offline Sync Manager
 *
 * Automatically syncs queued mutations when connection is restored.
 * Works across ALL desktop-ui modules.
 */
export function useOfflineSyncManager() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const executeMutation = useExecuteQueuedMutation();
  const syncingRef = useRef(false);
  const lastSyncAttempt = useRef<number>(0);

  useEffect(() => {
    const handleSync = async () => {
      // Only sync if:
      // 1. We're online now
      // 2. We were offline before
      // 3. Not currently syncing
      // 4. At least 2 seconds since last sync attempt (debounce)
      const now = Date.now();
      if (
        !isOnline ||
        !wasOffline ||
        syncingRef.current ||
        (now - lastSyncAttempt.current) < 2000
      ) {
        return;
      }

      syncingRef.current = true;
      lastSyncAttempt.current = now;

      const stats = getQueueStats();

      if (stats.total === 0) {
        syncingRef.current = false;
        return;
      }

      console.log('🔄 Starting offline sync...', stats);

      // Show sync toast
      const toastId = toast.loading(`Syncing ${stats.total} offline change${stats.total === 1 ? '' : 's'}...`, {
        duration: Infinity,
      });

      try {
        const result = await processQueue(executeMutation);

        // Invalidate all queries to ensure fresh data
        await queryClient.invalidateQueries();

        // Show result toast
        if (result.success > 0 && result.failed === 0) {
          toast.success(`✅ Synced ${result.success} change${result.success === 1 ? '' : 's'} successfully`, {
            id: toastId,
            duration: 3000,
          });
        } else if (result.success > 0 && result.failed > 0) {
          toast.warning(
            `⚠️ Synced ${result.success} change${result.success === 1 ? '' : 's'}, ${result.failed} failed`,
            {
              id: toastId,
              duration: 5000,
              description: 'Failed changes will be retried automatically',
            }
          );
        } else if (result.failed > 0) {
          toast.error(`❌ Failed to sync ${result.failed} change${result.failed === 1 ? '' : 's'}`, {
            id: toastId,
            duration: 5000,
            description: 'Changes will be retried later',
          });
        }

        // Log detailed results
        if (result.errors.length > 0) {
          console.error('Sync errors:', result.errors);
        }
      } catch (error: any) {
        console.error('Sync process error:', error);
        toast.error('Sync error - Will retry automatically', {
          id: toastId,
          duration: 3000,
        });
      } finally {
        syncingRef.current = false;
      }
    };

    // Trigger sync when connection is restored
    handleSync();
  }, [isOnline, wasOffline, queryClient, executeMutation]);

  // Also listen for manual sync requests
  useEffect(() => {
    const handleManualSync = () => {
      if (isOnline && !syncingRef.current) {
        // Reset wasOffline check for manual sync
        const stats = getQueueStats();
        if (stats.total > 0) {
          syncingRef.current = false; // Allow sync even if not coming from offline
          window.dispatchEvent(new Event('online')); // Trigger the sync logic
        } else {
          toast.info('No offline changes to sync');
        }
      } else if (!isOnline) {
        toast.warning('Cannot sync while offline');
      }
    };

    window.addEventListener('manualSync', handleManualSync);

    return () => {
      window.removeEventListener('manualSync', handleManualSync);
    };
  }, [isOnline]);
}

/**
 * Offline Sync Provider Component
 *
 * Add this to your root layout to enable automatic syncing
 */
export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useOfflineSyncManager();
  return <>{children}</>;
}

/**
 * Trigger manual sync (can be called from anywhere)
 */
export function triggerManualSync() {
  window.dispatchEvent(new Event('manualSync'));
}
