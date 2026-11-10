import { QueryClient } from '@tanstack/react-query'
import { isNotFound } from '@/shared/api/http'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
      },
    },
  })
}
