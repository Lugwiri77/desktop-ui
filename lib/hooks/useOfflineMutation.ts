import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { queueMutation } from '../offline-queue';
import { toast } from 'sonner';

export interface OptimisticUpdateConfig<TData, TVariables> {
  /** Query key to update optimistically */
  queryKey: string[];

  /** Function to update the cache data optimistically */
  updater: (oldData: any, variables: TVariables) => any;

  /** Whether to append to array (default: false) */
  appendToArray?: boolean;

  /** Whether to prepend to array (default: false) */
  prependToArray?: boolean;
}

export interface OfflineMutationOptions<TData, TVariables> {
  /** Module name (e.g., 'real-estate', 'education', 'visitor') */
  module: string;

  /** Operation name (e.g., 'registerTenant', 'markAttendance') */
  operation: string;

  /** GraphQL endpoint or REST endpoint */
  endpoint?: string;

  /** HTTP method */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /** Priority level for queue processing */
  priority?: 'high' | 'normal' | 'low';

  /** Maximum retry attempts */
  maxRetries?: number;

  /** Query keys to invalidate on success */
  invalidateKeys?: string[];

  /** Whether this operation requires authentication */
  requiresAuth?: boolean;

  /** Success callback */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /** Error callback */
  onError?: (error: Error, variables: TVariables) => void;

  /** Show toast notifications */
  showToast?: boolean;

  /** Custom success message */
  successMessage?: string | ((data: TData) => string);

  /** Custom error message */
  errorMessage?: string | ((error: Error) => string);

  /** Optimistic update configuration for instant UI feedback */
  optimisticUpdate?: OptimisticUpdateConfig<TData, TVariables>;
}

/**
 * Offline-aware mutation hook with optimistic updates
 *
 * Works across ALL desktop-ui modules (Real Estate, Education, Visitor, etc.)
 *
 * Features:
 * - Automatic queueing when offline
 * - Auto-retry with exponential backoff
 * - Optimistic updates with automatic rollback on error
 * - Toast notifications
 * - Cache invalidation
 *
 * @example Basic usage
 * ```typescript
 * const registerMutation = useOfflineMutation(
 *   (input: RegisterTenantInput) => registerTenant(input),
 *   {
 *     module: 'real-estate',
 *     operation: 'registerTenant',
 *     priority: 'high',
 *     invalidateKeys: ['tenants', 'units'],
 *     successMessage: 'Tenant registered successfully',
 *   }
 * );
 *
 * registerMutation.mutate(formData);
 * ```
 *
 * @example With optimistic updates (instant UI feedback)
 * ```typescript
 * const registerMutation = useOfflineMutation(
 *   (input: RegisterTenantInput) => registerTenant(input),
 *   {
 *     module: 'real-estate',
 *     operation: 'registerTenant',
 *     priority: 'high',
 *     invalidateKeys: ['tenants', 'units'],
 *     successMessage: (data) => `Tenant ${data.firstName} registered`,
 *     optimisticUpdate: {
 *       queryKey: ['tenants'],
 *       prependToArray: true,
 *       updater: (oldData, variables) => ({
 *         id: 'temp-' + Date.now(), // Temporary ID
 *         ...variables,
 *         tenantStatus: 'pending_move_in',
 *         createdAt: new Date().toISOString(),
 *       }),
 *     },
 *   }
 * );
 * ```
 *
 * @example Update existing item in array
 * ```typescript
 * const updateStatusMutation = useOfflineMutation(
 *   ({ tenantId, status }) => updateTenantStatus(tenantId, status),
 *   {
 *     module: 'real-estate',
 *     operation: 'updateTenantStatus',
 *     priority: 'normal',
 *     invalidateKeys: ['tenants'],
 *     optimisticUpdate: {
 *       queryKey: ['tenants'],
 *       updater: (oldData, variables) =>
 *         oldData.map(tenant =>
 *           tenant.id === variables.tenantId
 *             ? { ...tenant, tenantStatus: variables.status }
 *             : tenant
 *         ),
 *     },
 *   }
 * );
 * ```
 */
export function useOfflineMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OfflineMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const {
    module,
    operation,
    endpoint = '/graphql',
    method = 'POST',
    priority = 'normal',
    maxRetries = 3,
    invalidateKeys = [],
    requiresAuth = true,
    onSuccess,
    onError,
    showToast = true,
    successMessage,
    errorMessage,
    optimisticUpdate,
  } = options;

  return useMutation({
    mutationFn,

    onMutate: async (variables) => {
      // Show offline notification immediately if offline
      if (!isOnline && showToast) {
        toast.info('Offline mode - Changes will sync when connected', {
          duration: 3000,
        });
      }

      // Perform optimistic update if configured
      if (optimisticUpdate) {
        const { queryKey, updater, appendToArray, prependToArray } = optimisticUpdate;

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(queryKey);

        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, (oldData: any) => {
          // If no old data, initialize as empty array or object
          if (!oldData) {
            if (appendToArray || prependToArray) {
              return [updater(null, variables)];
            }
            return updater(null, variables);
          }

          // If appending/prepending to array
          if (Array.isArray(oldData)) {
            const newItem = updater(oldData, variables);

            if (prependToArray) {
              return [newItem, ...oldData];
            } else if (appendToArray) {
              return [...oldData, newItem];
            }

            // Otherwise, let the updater handle it
            return updater(oldData, variables);
          }

          // For non-array data, use the updater function
          return updater(oldData, variables);
        });

        // Return context with previous data for rollback
        return { previousData, queryKey };
      }

      // Return context for potential rollback
      return { variables };
    },

    onSuccess: (data, variables) => {
      // Invalidate cache
      if (invalidateKeys.length > 0) {
        invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      // Show success toast
      if (showToast) {
        const message = typeof successMessage === 'function'
          ? successMessage(data)
          : successMessage || `${operation} completed successfully`;

        if (!isOnline) {
          toast.success(`${message} (Queued for sync)`, { duration: 3000 });
        } else {
          toast.success(message, { duration: 2000 });
        }
      }

      // Call custom success handler
      onSuccess?.(data, variables);
    },

    onError: (error: any, variables, context: any) => {
      console.error(`[${module}] ${operation} failed:`, error);

      // Rollback optimistic update if it was performed
      if (context?.previousData !== undefined && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
        console.log(`🔄 Rolled back optimistic update for ${context.queryKey.join('/')}`);
      }

      // If offline, queue the mutation
      if (!isOnline) {
        const queueId = queueMutation({
          module,
          operation,
          endpoint,
          method,
          body: variables,
          maxRetries,
          priority,
          requiresAuth,
        });

        if (showToast) {
          toast.warning('Queued for sync when online', {
            duration: 3000,
            description: `${operation} will be retried automatically`,
          });
        }

        console.log(`📦 Queued [${module}] ${operation} with ID: ${queueId}`);
      } else {
        // Online but failed - show error
        const message = typeof errorMessage === 'function'
          ? errorMessage(error)
          : errorMessage || error.message || `${operation} failed`;

        if (showToast) {
          toast.error(message, { duration: 4000 });
        }

        // Call custom error handler
        onError?.(error, variables);
      }
    },
  });
}

/**
 * Hook to execute a queued mutation
 *
 * Used internally by the sync manager
 */
export function useExecuteQueuedMutation() {
  return async (mutation: any) => {
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'desktop',
    };

    if (mutation.requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(mutation.endpoint, {
      method: mutation.method,
      headers,
      body: JSON.stringify(mutation.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync failed (${response.status}): ${errorText}`);
    }

    return response.json();
  };
}
