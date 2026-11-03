import { useQuery, useQueryClient } from '@tanstack/react-query'
import { findProductInLists, productDetailQuery } from '../queries'

export function useProduct(id: number) {
  const queryClient = useQueryClient()
  return useQuery({
    ...productDetailQuery(id),
    placeholderData: () => findProductInLists(queryClient, id),
  })
}
