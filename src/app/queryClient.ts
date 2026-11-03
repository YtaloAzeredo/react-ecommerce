import { QueryClient } from '@tanstack/react-query'
import { HttpError } from '@/shared/api/http'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof HttpError && error.status === 404) && failureCount < 1,
      },
    },
  })
}
