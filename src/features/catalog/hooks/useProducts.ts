import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { productListQuery, type ProductListParams } from '../queries'

export function useProducts(params: ProductListParams) {
  const queryClient = useQueryClient()
  const query = useQuery({
    ...productListQuery(params),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2].category === params.category ? previousData : undefined,
  })

  const { page, category } = params
  const totalPages = query.isPlaceholderData ? undefined : query.data?.totalPages
  useEffect(() => {
    if (totalPages !== undefined && page < totalPages) {
      void queryClient.prefetchQuery(productListQuery({ page: page + 1, category }))
    }
  }, [queryClient, page, category, totalPages])

  return query
}
