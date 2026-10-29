import { queryOptions } from '@tanstack/react-query'
import { fetchCategories, fetchProducts } from './api/productsApi'

export type ProductListParams = { page: number; category: string | null }

// Chaves hierárquicas: invalidar productKeys.all atinge listas e detalhes de uma vez.
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
}

export function productListQuery(params: ProductListParams) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => fetchProducts(params, signal),
  })
}

export function categoriesQuery() {
  return queryOptions({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => fetchCategories(signal),
  })
}
