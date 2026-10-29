import { QueryClient } from '@tanstack/react-query'
import { HttpError } from '@/shared/api/http'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados de catálogo mudam pouco: 5 min frescos evitam refazer a busca ao voltar para uma tela.
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        // Um 404 não vai mudar tentando de novo; outros erros (rede, 5xx) ganham uma segunda chance.
        retry: (failureCount, error) =>
          !(error instanceof HttpError && error.status === 404) && failureCount < 1,
      },
    },
  })
}
