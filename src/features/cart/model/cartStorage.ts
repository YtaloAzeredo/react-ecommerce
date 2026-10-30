import { z } from 'zod'
import { emptyCart, type CartItem, type CartState } from './cartReducer'

// A versão na chave permite mudar o formato no futuro sem ler um carrinho antigo como se fosse novo.
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

// O localStorage pode ter sido editado à mão ou vir de uma versão antiga do app: o que não tiver o
// formato esperado é descartado, e o pior caso é um carrinho vazio, nunca uma tela quebrada.
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

// Storage cheio ou bloqueado (modo privado de alguns navegadores) não pode derrubar o carrinho em
// memória: a compra continua, só não sobrevive a recarregar a página.
export function saveCart(state: CartState, storage?: Storage): void {
  try {
    ;(storage ?? window.localStorage).setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem persistência nesta sessão
  }
}
