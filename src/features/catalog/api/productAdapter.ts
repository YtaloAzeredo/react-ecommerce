import type { Category, Product, ProductPage } from '../model/types'
import type { CategoryDto, ProductDto, ProductListDto } from './dto'

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    brand: dto.brand ?? null,
    priceCents: Math.round(dto.price * 100),
    rating: dto.rating,
    stock: dto.stock,
    thumbnailUrl: dto.thumbnail,
    imageUrls: dto.images,
  }
}

export function toProductPage(dto: ProductListDto, page: number, pageSize: number): ProductPage {
  return {
    items: dto.products.map(toProduct),
    page,
    pageSize,
    total: dto.total,
    totalPages: Math.max(1, Math.ceil(dto.total / pageSize)),
  }
}

export function toCategory(dto: CategoryDto): Category {
  return { slug: dto.slug, name: dto.name }
}
