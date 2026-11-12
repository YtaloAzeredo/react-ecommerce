export interface Product {
  id: number
  title: string
  description: string
  category: string
  brand: string | null
  priceCents: number
  rating: number
  stock: number
  thumbnailUrl: string
  imageUrls: string[]
}

export interface ProductPage {
  items: Product[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Category {
  slug: string
  name: string
}

export const productSorts = ['price-asc', 'price-desc', 'title-asc'] as const

export type ProductSort = (typeof productSorts)[number]

export interface ProductListParams {
  page: number
  category: string | null
  search: string | null
  sort: ProductSort | null
}
