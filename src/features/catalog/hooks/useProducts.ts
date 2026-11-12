import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ProductListParams } from '../model/types'
import { productListQuery } from '../queries'

export function useProducts(params: ProductListParams) {
  const queryClient = useQueryClient()
  const query = useQuery({
    ...productListQuery(params),
    placeholderData: (previousData, previousQuery) => {
      const previous = previousQuery?.queryKey[2]
      return previous?.category === params.category &&
        previous?.search === params.search &&
        previous?.sort === params.sort
        ? previousData
        : undefined
    },
  })

  const { page, category, search, sort } = params
  const totalPages = query.isPlaceholderData ? undefined : query.data?.totalPages
  useEffect(() => {
    if (totalPages !== undefined && page < totalPages) {
      void queryClient.prefetchQuery(productListQuery({ page: page + 1, category, search, sort }))
    }
  }, [queryClient, page, category, search, sort, totalPages])

  return query
}
