'use client'

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query'
import { get, post, put, del } from '@/lib/api'

/**
 * Query Keys - Centralized for easy cache management
 */
export const QueryKeys = {
  // Staff
  staffList: ['staff', 'list'] as const,
  staffDetails: (id: string) => ['staff', 'details', id] as const,

  // Organization
  organizationInfo: ['organization', 'info'] as const,
  databaseConfig: ['organization', 'database-config'] as const,

  // User
  userProfile: ['user', 'profile'] as const,
  userSettings: ['user', 'settings'] as const,

  // Add more as needed
} as const

/**
 * Hook for fetching staff list with caching
 * - Caches data for 5 minutes
 * - Refetches in background when stale
 * - Shows cached data immediately while refetching
 */
export function useStaffList() {
  return useQuery({
    queryKey: QueryKeys.staffList,
    queryFn: async () => {
      const response = await get<{
        status: string
        message: string
        staff: any[]
        total: number
      }>('/auth/staff')
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  })
}

/**
 * Hook for fetching database configuration
 */
export function useDatabaseConfig() {
  return useQuery({
    queryKey: QueryKeys.databaseConfig,
    queryFn: async () => {
      const response = await get<{
        status: string
        database_strategy: string
        connection_details?: any
        needs_migration: boolean
      }>('/auth/organization/database-config')
      return response
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for fetching organization info
 */
export function useOrganizationInfo() {
  return useQuery({
    queryKey: QueryKeys.organizationInfo,
    queryFn: async () => {
      const response = await get<{
        status: string
        organization: any
      }>('/auth/organization/info')
      return response
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for creating/updating staff with automatic cache invalidation
 */
export function useStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { method: 'create' | 'update' | 'delete', payload: any }) => {
      switch (data.method) {
        case 'create':
          return await post('/auth/staff', data.payload)
        case 'update':
          return await put(`/auth/staff/${data.payload.id}`, data.payload)
        case 'delete':
          return await del(`/auth/staff/${data.payload.id}`)
        default:
          throw new Error('Invalid method')
      }
    },
    onSuccess: () => {
      // Invalidate staff list cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: QueryKeys.staffList })
    },
  })
}

/**
 * Hook for database configuration mutations
 */
export function useDatabaseConfigMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: any) => {
      return await post('/auth/organization/save-database-config', config)
    },
    onSuccess: () => {
      // Invalidate database config cache
      queryClient.invalidateQueries({ queryKey: QueryKeys.databaseConfig })
    },
  })
}

/**
 * Hook for data migration with cache invalidation
 */
export function useDataMigration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      source_strategy: string
      target_strategy: string
    }) => {
      return await post('/auth/organization/migrate-data', payload)
    },
    onSuccess: () => {
      // Invalidate all staff-related caches after migration
      queryClient.invalidateQueries({ queryKey: QueryKeys.staffList })
      queryClient.invalidateQueries({ queryKey: QueryKeys.databaseConfig })
    },
  })
}

/**
 * Generic hook for any GET request with caching
 * @param key - Unique cache key
 * @param url - API endpoint
 * @param options - Query options
 */
export function useCachedGet<T>(
  key: QueryKey,
  url: string,
  options?: {
    staleTime?: number
    gcTime?: number
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await get<T>(url)
      return response
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  })
}

/**
 * Generic hook for any POST/PUT/DELETE with cache invalidation
 * @param invalidateKeys - Cache keys to invalidate after mutation
 */
export function useCachedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: QueryKey[]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate specified caches
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })
}

/**
 * Hook to manually invalidate caches
 */
export function useInvalidateCache() {
  const queryClient = useQueryClient()

  return {
    invalidateStaffList: () => queryClient.invalidateQueries({ queryKey: QueryKeys.staffList }),
    invalidateDatabaseConfig: () => queryClient.invalidateQueries({ queryKey: QueryKeys.databaseConfig }),
    invalidateAll: () => queryClient.invalidateQueries(),
    clearAll: () => queryClient.clear(),
  }
}

/**
 * Hook to prefetch data (useful for preloading tabs)
 */
export function usePrefetch() {
  const queryClient = useQueryClient()

  return {
    prefetchStaffList: () => {
      queryClient.prefetchQuery({
        queryKey: QueryKeys.staffList,
        queryFn: async () => {
          const response = await get<{
            status: string
            message: string
            staff: any[]
            total: number
          }>('/auth/staff')
          return response
        },
      })
    },
    prefetchDatabaseConfig: () => {
      queryClient.prefetchQuery({
        queryKey: QueryKeys.databaseConfig,
        queryFn: async () => {
          const response = await get<{
            status: string
            database_strategy: string
            connection_details?: any
            needs_migration: boolean
          }>('/auth/organization/database-config')
          return response
        },
      })
    },
  }
}
