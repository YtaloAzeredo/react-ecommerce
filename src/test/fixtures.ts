import type { ProductDto, ProductListDto } from '@/features/catalog/api/dto'

// Produto no formato da DummyJSON; título e imagens derivam do id para facilitar asserções.
export function makeProductDto(overrides: Partial<ProductDto> = {}): ProductDto {
  const id = overrides.id ?? 1
  return {
    id,
    title: `Produto ${id}`,
    description: `Descrição do produto ${id}`,
    category: 'beauty',
    price: 9.99,
    rating: 4.5,
    stock: 10,
    brand: 'Marca',
    thumbnail: `https://cdn.example.com/${id}/thumbnail.webp`,
    images: [`https://cdn.example.com/${id}/1.webp`],
    ...overrides,
  }
}

export function makeProductListDto(
  products: ProductDto[],
  total: number = products.length,
): ProductListDto {
  return { products, total, skip: 0, limit: products.length }
}
