import { httpGet } from '@/shared/api/http'
import type { Category, Product, ProductListParams, ProductPage, ProductSort } from '../model/types'
import type { CategoryDto, ProductDto, ProductListDto } from './dto'
import { toCategory, toProduct, toProductPage } from './productAdapter'

export const PAGE_SIZE = 12

const sortParams: Record<ProductSort, { sortBy: string; order: 'asc' | 'desc' }> = {
  'price-asc': { sortBy: 'price', order: 'asc' },
  'price-desc': { sortBy: 'price', order: 'desc' },
  'title-asc': { sortBy: 'title', order: 'asc' },
}

export async function fetchProducts(
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<ProductPage> {
  const path = params.search
    ? '/products/search'
    : params.category
      ? `/products/category/${encodeURIComponent(params.category)}`
      : '/products'
  const dto = await httpGet<ProductListDto>(path, {
    params: {
      q: params.search ?? undefined,
      ...(params.sort ? sortParams[params.sort] : {}),
      limit: PAGE_SIZE,
      skip: (params.page - 1) * PAGE_SIZE,
    },
    signal,
  })
  return toProductPage(dto, params.page, PAGE_SIZE)
}

export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product> {
  return toProduct(await httpGet<ProductDto>(`/products/${id}`, { signal }))
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const dtos = await httpGet<CategoryDto[]>('/products/categories', { signal })
  return dtos.map(toCategory)
}
