import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { productListQuery, type ProductListParams } from '../queries'

export function useProducts(params: ProductListParams) {
  const queryClient = useQueryClient()
  const query = useQuery({
    ...productListQuery(params),
    // Ao trocar de página, a anterior fica na tela enquanto a próxima carrega, em vez de piscar
    // um "carregando". Ao trocar de categoria não: mostrar produtos de outra categoria sob o título
    // novo seria pior que o "carregando".
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2].category === params.category ? previousData : undefined,
  })

  // Com a página atual carregada, a próxima já vem para o cache: clicar em "Próxima" abre na hora.
  const { page, category } = params
  const totalPages = query.isPlaceholderData ? undefined : query.data?.totalPages
  useEffect(() => {
    if (totalPages !== undefined && page < totalPages) {
      void queryClient.prefetchQuery(productListQuery({ page: page + 1, category }))
    }
  }, [queryClient, page, category, totalPages])

  return query
}
