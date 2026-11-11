import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { fetchCategories, fetchProduct, fetchProducts } from './api/productsApi'
import type { Product, ProductListParams, ProductPage } from './model/types'

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

export function productDetailQuery(id: number) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => fetchProduct(id, signal),
  })
}

export function findProductInLists(queryClient: QueryClient, id: number): Product | undefined {
  for (const [, page] of queryClient.getQueriesData<ProductPage>({
    queryKey: productKeys.lists(),
  })) {
    const product = page?.items.find((item) => item.id === id)
    if (product) return product
  }
  return undefined
}

export function findKnownTotalPages(
  queryClient: QueryClient,
  filter: Pick<ProductListParams, 'category' | 'search'>,
): number | undefined {
  for (const [, page] of queryClient.getQueriesData<ProductPage>({
    queryKey: [...productKeys.lists(), filter],
  })) {
    if (page) return page.totalPages
  }
  return undefined
}
