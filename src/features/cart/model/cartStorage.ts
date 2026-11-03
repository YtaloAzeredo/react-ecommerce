import { z } from 'zod'
import { emptyCart, type CartItem, type CartState } from './cartReducer'

export const CART_STORAGE_KEY = 'vitrine:cart:v1'

const storedCartSchema = z.object({ items: z.array(z.unknown()) })

const cartItemSchema = z.object({
  productId: z.number().int(),
  title: z.string(),
  priceCents: z.number().int().nonnegative(),
  thumbnailUrl: z.string(),
  maxQuantity: z.number().int().nonnegative(),
  quantity: z.number().int(),
})

export function loadCart(storage?: Storage): CartState {
  try {
    const raw = (storage ?? window.localStorage).getItem(CART_STORAGE_KEY)
    if (raw === null) return emptyCart
    const stored = storedCartSchema.safeParse(JSON.parse(raw))
    if (!stored.success) return emptyCart
    const items = stored.data.items.flatMap((value): CartItem[] => {
      const item = cartItemSchema.safeParse(value)
      if (!item.success) return []
      const quantity = Math.min(item.data.quantity, item.data.maxQuantity)
      return quantity > 0 ? [{ ...item.data, quantity }] : []
    })
    return { items }
  } catch {
    return emptyCart
  }
}

export function saveCart(state: CartState, storage?: Storage): void {
  try {
    ;(storage ?? window.localStorage).setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}
