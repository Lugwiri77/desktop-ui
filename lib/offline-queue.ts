/**
 * Offline Mutation Queue
 *
 * Stores failed mutations and retries them when online.
 * Works across ALL desktop-ui modules: Real Estate, Education, Visitor Management, etc.
 */

export interface QueuedMutation {
  id: string;
  timestamp: number;
  module: string; // 'real-estate', 'education', 'visitor', 'staff', etc.
  operation: string; // e.g., 'registerTenant', 'markAttendance', 'checkInVisitor'
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
  requiresAuth: boolean;
  status: 'pending' | 'failed';
  lastError?: string;
  failedAt?: number;
}

const QUEUE_STORAGE_KEY = 'offline_mutation_queue_v1';
const MAX_QUEUE_SIZE = 100;
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get all queued mutations
 */
export function getQueuedMutations(): QueuedMutation[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!stored) return [];

  try {
    const queue: QueuedMutation[] = JSON.parse(stored);

    // Filter out expired mutations
    const now = Date.now();
    const validQueue = queue.filter(m => (now - m.timestamp) < MAX_QUEUE_AGE_MS);

    // Update storage if any were removed
    if (validQueue.length !== queue.length) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(validQueue));
      console.log(`🗑️ Removed ${queue.length - validQueue.length} expired mutations`);
    }

    return validQueue;
  } catch (error) {
    console.error('Failed to parse queued mutations:', error);
    return [];
  }
}

/**
 * Add a mutation to the queue
 */
export function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): string {
  if (typeof window === 'undefined') return '';

  const queue = getQueuedMutations();

  // Check if queue is full
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('⚠️ Mutation queue is full. Removing oldest low-priority item.');
    // Remove oldest low-priority item
    const lowPriorityIndex = queue.findIndex(m => m.priority === 'low');
    if (lowPriorityIndex !== -1) {
      queue.splice(lowPriorityIndex, 1);
    } else {
      // If no low priority items, remove oldest
      queue.shift();
    }
  }

  const queuedMutation: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  queue.push(queuedMutation);

  // Sort by priority (high -> normal -> low) and timestamp
  queue.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.timestamp - b.timestamp;
  });

  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

  console.log(`📦 Queued mutation: [${mutation.module}] ${mutation.operation} (${queue.length} in queue)`);

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue } }));

  return queuedMutation.id;
}

/**
 * Remove a mutation from the queue
 */
export function dequeueMutation(id: string): void {
  if (typeof window === 'undefined') return;

  const queue = getQueuedMutations();
  const filtered = queue.filter(m => m.id !== id);

  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));

  console.log(`✅ Dequeued mutation: ${id} (${filtered.length} remaining)`);

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue: filtered } }));
}

/**
 * Update retry count for a mutation and track error
 */
export function updateMutationRetryCount(id: string, error?: string): boolean {
  if (typeof window === 'undefined') return false;

  const queue = getQueuedMutations();
  const mutation = queue.find(m => m.id === id);

  if (mutation) {
    mutation.retryCount++;
    mutation.lastError = error;
    mutation.failedAt = Date.now();

    // Mark as failed if max retries reached
    if (mutation.retryCount >= mutation.maxRetries) {
      mutation.status = 'failed';
      console.error(`❌ Max retries reached for mutation: [${mutation.module}] ${mutation.operation}`);
      console.error(`   Last error: ${error}`);
      // Keep it in the queue but marked as failed so user can see it
    } else {
      // Still pending, will retry
      mutation.status = 'pending';
    }

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue } }));

    return mutation.status === 'pending'; // Return true if still retrying
  }

  return false;
}

/**
 * Clear all queued mutations (use with caution)
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_STORAGE_KEY);
  console.log('🗑️ Cleared all queued mutations');
  window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue: [] } }));
}

/**
 * Clear mutations for a specific module
 */
export function clearModuleQueue(module: string): void {
  if (typeof window === 'undefined') return;

  const queue = getQueuedMutations();
  const filtered = queue.filter(m => m.module !== module);

  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  console.log(`🗑️ Cleared ${queue.length - filtered.length} mutations for module: ${module}`);
  window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue: filtered } }));
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  const queue = getQueuedMutations();

  const byModule: Record<string, number> = {};
  queue.forEach(m => {
    byModule[m.module] = (byModule[m.module] || 0) + 1;
  });

  return {
    total: queue.length,
    byPriority: {
      high: queue.filter(m => m.priority === 'high').length,
      normal: queue.filter(m => m.priority === 'normal').length,
      low: queue.filter(m => m.priority === 'low').length,
    },
    byModule,
    oldest: queue.length > 0 ? new Date(queue[0].timestamp) : null,
    newest: queue.length > 0 ? new Date(queue[queue.length - 1].timestamp) : null,
  };
}

/**
 * Process queued mutations when back online
 */
export async function processQueue(
  executeMutation: (mutation: QueuedMutation) => Promise<void>
): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  const queue = getQueuedMutations();

  if (queue.length === 0) {
    console.log('📭 No queued mutations to process');
    return { success: 0, failed: 0, errors: [] };
  }

  console.log(`🔄 Processing ${queue.length} queued mutations...`);

  // Dispatch sync start event
  window.dispatchEvent(new CustomEvent('syncStart', { detail: { total: queue.length } }));

  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  // Process mutations sequentially to avoid race conditions
  for (let i = 0; i < queue.length; i++) {
    const mutation = queue[i];
    try {
      await executeMutation(mutation);
      dequeueMutation(mutation.id);
      success++;

      // Dispatch progress event
      window.dispatchEvent(new CustomEvent('syncProgress', {
        detail: { current: i + 1, total: queue.length }
      }));

      // Small delay between operations to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error(`❌ Failed to process mutation ${mutation.id}:`, error);
      errors.push({ id: mutation.id, error: errorMessage });

      const shouldRetry = updateMutationRetryCount(mutation.id, errorMessage);
      if (!shouldRetry) {
        failed++;
      }

      // Stop processing if multiple consecutive failures (might still be offline)
      if (errors.length >= 3) {
        console.warn('⚠️ Multiple consecutive failures detected. Stopping queue processing.');
        break;
      }
    }
  }

  console.log(`✅ Queue processing complete: ${success} success, ${failed} failed permanently`);

  // Dispatch sync complete event
  window.dispatchEvent(new CustomEvent('syncComplete', {
    detail: { success, failed, errors }
  }));

  return { success, failed, errors };
}

/**
 * Retry a single failed mutation
 */
export function retryMutation(id: string): void {
  if (typeof window === 'undefined') return;

  const queue = getQueuedMutations();
  const mutation = queue.find(m => m.id === id);

  if (mutation) {
    // Reset retry state
    mutation.retryCount = 0;
    mutation.status = 'pending';
    mutation.lastError = undefined;
    mutation.failedAt = undefined;

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    console.log(`🔄 Resetting mutation for retry: [${mutation.module}] ${mutation.operation}`);
    window.dispatchEvent(new CustomEvent('queueUpdated', { detail: { queue } }));
  }
}

/**
 * Remove a specific mutation from the queue
 */
export function removeMutation(id: string): void {
  dequeueMutation(id);
}
