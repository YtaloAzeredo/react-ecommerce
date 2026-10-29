import { httpGet } from '@/shared/api/http'
import type { Category, Product, ProductPage } from '../model/types'
import type { CategoryDto, ProductDto, ProductListDto } from './dto'
import { toCategory, toProduct, toProductPage } from './productAdapter'

export const PAGE_SIZE = 12

export async function fetchProducts(
  params: { page: number; category: string | null },
  signal?: AbortSignal,
): Promise<ProductPage> {
  const path = params.category
    ? `/products/category/${encodeURIComponent(params.category)}`
    : '/products'
  const dto = await httpGet<ProductListDto>(path, {
    params: { limit: PAGE_SIZE, skip: (params.page - 1) * PAGE_SIZE },
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
