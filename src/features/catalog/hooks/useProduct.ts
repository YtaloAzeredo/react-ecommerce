import { useQuery, useQueryClient } from '@tanstack/react-query'
import { findProductInLists, productDetailQuery } from '../queries'

export function useProduct(id: number) {
  const queryClient = useQueryClient()
  return useQuery({
    ...productDetailQuery(id),
    // Mostra na hora o que veio na lista e confirma com a API em seguida.
    placeholderData: () => findProductInLists(queryClient, id),
  })
}
