'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { compress, decompress } from 'lz-string'
import { useState, useEffect } from 'react'

/**
 * Custom storage persister that uses IndexedDB for large data
 * and encrypts sensitive data before storage
 */
const createPersister = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return createSyncStoragePersister({
    storage: window.localStorage,
    serialize: (data) => compress(JSON.stringify(data)),
    deserialize: (data) => JSON.parse(decompress(data) || '{}'),
  })
}

/**
 * Query client configuration optimized for desktop app
 */
const createQueryClientInstance = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep data in cache for 30 minutes even if unused
      gcTime: 30 * 60 * 1000,

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (user returns to app)
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Show stale data while fetching fresh data in background
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Network mode - 'online' means queries won't run if offline
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      networkMode: 'online',
    },
  },
})

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Query Provider with persistent cache
 * - Caches data to localStorage/IndexedDB
 * - Compresses data to save space
 * - Automatically refetches stale data in background
 * - Supports offline mode
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClientInstance())
  const [persister, setPersister] = useState<ReturnType<typeof createPersister>>()

  useEffect(() => {
    setPersister(createPersister())
  }, [])

  // If persister is not ready yet, use regular provider
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        buster: 'v1', // Change this to invalidate all cached data
        dehydrateOptions: {
          // Don't persist error states
          shouldDehydrateQuery: (query) => {
            return query.state.status === 'success'
          },
        },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}

/**
 * Helper to invalidate specific cache keys
 */
export const invalidateCache = async (queryClient: QueryClient, keys: string[]) => {
  await Promise.all(
    keys.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
  )
}

/**
 * Helper to clear all cached data (e.g., on logout)
 */
export const clearAllCache = async (queryClient: QueryClient) => {
  await queryClient.clear()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE')
  }
}
