'use client';

import { useState, useEffect } from 'react';
import { getQueuedMutations, getQueueStats, clearQueue, retryMutation, removeMutation, type QueuedMutation } from '@/lib/offline-queue';
import { triggerManualSync } from '@/lib/offline-sync-manager';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { Button } from './button';
import { Badge } from './badge';
import { Dialog, DialogTitle, DialogBody, DialogActions } from './dialog';

/**
 * Floating badge showing pending operations count
 */
export function OfflineQueueBadge() {
  const [queueCount, setQueueCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const updateCount = () => {
      const stats = getQueueStats();
      setQueueCount(stats.total);
    };

    // Update on mount
    updateCount();

    // Listen for queue updates
    window.addEventListener('queueUpdated', updateCount);

    return () => {
      window.removeEventListener('queueUpdated', updateCount);
    };
  }, []);

  if (queueCount === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 hover:scale-110 transition-all duration-300 animate-pulse"
        title="View pending offline operations"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <span className="font-semibold">{queueCount} Pending</span>
      </button>

      <OfflineQueueDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

/**
 * Dialog showing all pending operations
 */
export function OfflineQueueDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mutations, setMutations] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (isOpen) {
      const updateMutations = () => {
        setMutations(getQueuedMutations());
      };

      const handleSyncStart = (event: any) => {
        setIsSyncing(true);
        setSyncProgress({ current: 0, total: event.detail.total });
      };

      const handleSyncProgress = (event: any) => {
        setSyncProgress({ current: event.detail.current, total: event.detail.total });
      };

      const handleSyncComplete = () => {
        setIsSyncing(false);
        setSyncProgress({ current: 0, total: 0 });
      };

      updateMutations();
      window.addEventListener('queueUpdated', updateMutations);
      window.addEventListener('syncStart', handleSyncStart);
      window.addEventListener('syncProgress', handleSyncProgress);
      window.addEventListener('syncComplete', handleSyncComplete);

      return () => {
        window.removeEventListener('queueUpdated', updateMutations);
        window.removeEventListener('syncStart', handleSyncStart);
        window.removeEventListener('syncProgress', handleSyncProgress);
        window.removeEventListener('syncComplete', handleSyncComplete);
      };
    }
  }, [isOpen]);

  const handleSync = () => {
    triggerManualSync();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all pending operations? This cannot be undone.')) {
      clearQueue();
      onClose();
    }
  };

  const stats = getQueueStats();

  return (
    <Dialog open={isOpen} onClose={onClose} size="2xl">
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>Pending Offline Operations</span>
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm font-normal text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Syncing {syncProgress.current}/{syncProgress.total}...</span>
            </div>
          )}
        </div>
      </DialogTitle>

      {/* Sync Progress Bar */}
      {isSyncing && (
        <div className="px-6 pb-4">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 ease-out"
              style={{
                width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <DialogBody>
        {/* Stats Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-2xl font-bold text-red-600">
                {mutations.filter(m => m.status === 'failed').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">High Priority</div>
              <div className="text-2xl font-bold text-red-600">{stats.byPriority.high}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Normal</div>
              <div className="text-2xl font-bold text-blue-600">{stats.byPriority.normal}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Low Priority</div>
              <div className="text-2xl font-bold text-gray-600">{stats.byPriority.low}</div>
            </div>
          </div>

          {stats.oldest && (
            <div className="mt-3 text-sm text-gray-600">
              Oldest: {new Date(stats.oldest).toLocaleString()}
            </div>
          )}
        </div>

        {/* By Module */}
        {Object.keys(stats.byModule).length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">By Module</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byModule).map(([module, count]) => (
                <Badge key={module} color="zinc">
                  {module}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Operations List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {mutations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending operations
            </div>
          ) : (
            mutations.map((mutation, index) => (
              <div
                key={mutation.id}
                className={`border rounded-lg p-3 transition-all duration-300 ease-in-out ${
                  mutation.status === 'failed'
                    ? 'border-red-300 bg-red-50 animate-pulse-slow'
                    : 'border-gray-200 hover:bg-gray-50 hover:shadow-md'
                }`}
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        color={
                          mutation.priority === 'high'
                            ? 'red'
                            : mutation.priority === 'normal'
                            ? 'blue'
                            : 'zinc'
                        }
                      >
                        {mutation.priority}
                      </Badge>
                      {mutation.status === 'failed' && (
                        <Badge color="red">Failed</Badge>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {mutation.module}
                      </span>
                      <span className="text-sm text-gray-600">→</span>
                      <span className="text-sm text-gray-600">
                        {mutation.operation}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(mutation.timestamp).toLocaleString()}
                      {mutation.retryCount > 0 && mutation.status !== 'failed' && (
                        <span className="ml-2 text-amber-600">
                          (Retry {mutation.retryCount}/{mutation.maxRetries})
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {mutation.lastError && (
                      <div className="mt-2 text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1">
                        <span className="font-semibold">Error:</span> {mutation.lastError}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {mutation.status === 'failed' && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          outline
                          color="blue"
                          onClick={() => {
                            retryMutation(mutation.id);
                            toast.success('Mutation queued for retry');
                            if (isOnline) {
                              setTimeout(() => triggerManualSync(), 500);
                            }
                          }}
                          disabled={!isOnline}
                        >
                          Retry
                        </Button>
                        <Button
                          outline
                          color="red"
                          onClick={() => {
                            if (confirm('Remove this failed operation?')) {
                              removeMutation(mutation.id);
                              toast.success('Operation removed');
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {mutation.method}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose}>
          Close
        </Button>
        {mutations.length > 0 && (
          <>
            <Button
              color="red"
              onClick={handleClear}
              disabled={!isOnline && mutations.length > 0}
            >
              Clear All
            </Button>
            <Button
              color="blue"
              onClick={handleSync}
              disabled={!isOnline}
            >
              {isOnline ? 'Sync Now' : 'Offline'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
