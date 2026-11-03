import type { CartItem } from '@/features/cart/model/cartReducer'
import { CART_STORAGE_KEY } from '@/features/cart/model/cartStorage'
import type { ProductDto, ProductListDto } from '@/features/catalog/api/dto'

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

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const productId = overrides.productId ?? 1
  return {
    productId,
    title: `Produto ${productId}`,
    priceCents: 999,
    thumbnailUrl: `https://cdn.example.com/${productId}/thumbnail.webp`,
    maxQuantity: 10,
    quantity: 1,
    ...overrides,
  }
}

export function seedCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }))
}
