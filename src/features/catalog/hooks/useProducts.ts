import { useQuery } from '@tanstack/react-query'
import { productListQuery, type ProductListParams } from '../queries'

export function useProducts(params: ProductListParams) {
  return useQuery({
    ...productListQuery(params),
    // Ao trocar de página, a anterior fica na tela enquanto a próxima carrega, em vez de piscar
    // um "carregando". Ao trocar de categoria não: mostrar produtos de outra categoria sob o título
    // novo seria pior que o "carregando".
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2].category === params.category ? previousData : undefined,
  })
}
