import { createQueryClient } from '@/app/queryClient'

export function createTestQueryClient() {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  })
  return queryClient
}
