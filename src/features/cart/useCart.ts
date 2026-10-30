import { createContext, use } from 'react'
import type { Product } from '@/features/catalog/model/types'
import type { CartItem } from './model/cartReducer'

export interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotalCents: number
  add(product: Product, quantity?: number): void
  setQuantity(productId: number, quantity: number): void
  remove(productId: number): void
  clear(): void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const cart = use(CartContext)
  if (!cart) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return cart
}
