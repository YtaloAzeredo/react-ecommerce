import { createQueryClient } from '@/app/queryClient'

// Mesma configuração de cache do app, sem novas tentativas: um erro aparece na hora no teste.
export function createTestQueryClient() {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  })
  return queryClient
}
