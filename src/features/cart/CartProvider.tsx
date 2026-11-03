import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Product } from '@/features/catalog/model/types'
import {
  cartReducer,
  selectItemCount,
  selectSubtotalCents,
  type CartItem,
} from './model/cartReducer'
import { CART_STORAGE_KEY, loadCart, saveCart } from './model/cartStorage'
import { CartContext, type CartContextValue } from './useCart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => loadCart())

  useEffect(() => {
    saveCart(state)
  }, [state])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        dispatch({ type: 'replace', state: loadCart() })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: selectItemCount(state),
      subtotalCents: selectSubtotalCents(state),
      add: (product, quantity) => dispatch({ type: 'add', item: toCartItem(product), quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [state],
  )

  return <CartContext value={value}>{children}</CartContext>
}

function toCartItem(product: Product): Omit<CartItem, 'quantity'> {
  return {
    productId: product.id,
    title: product.title,
    priceCents: product.priceCents,
    thumbnailUrl: product.thumbnailUrl,
    maxQuantity: product.stock,
  }
}
