export interface CartItem {
  productId: number
  title: string
  priceCents: number
  thumbnailUrl: string
  // Estoque do produto quando foi adicionado; o carrinho nunca passa disso.
  maxQuantity: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
}

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'>; quantity?: number }
  | { type: 'setQuantity'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' }
  | { type: 'replace'; state: CartState }

export const emptyCart: CartState = { items: [] }

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const adding = Math.floor(action.quantity ?? 1)
      if (adding < 1) return state
      const existing = state.items.find((item) => item.productId === action.item.productId)
      const quantity = Math.min((existing?.quantity ?? 0) + adding, action.item.maxQuantity)
      if (quantity <= 0) return state
      // O produto adicionado de novo traz preço e estoque atualizados; a posição na lista se mantém.
      const added = { ...action.item, quantity }
      return existing
        ? { items: state.items.map((item) => (item === existing ? added : item)) }
        : { items: [...state.items, added] }
    }
    case 'setQuantity': {
      const quantity = Math.floor(action.quantity)
      if (quantity <= 0) return cartReducer(state, { type: 'remove', productId: action.productId })
      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item,
        ),
      }
    }
    case 'remove':
      return { items: state.items.filter((item) => item.productId !== action.productId) }
    case 'clear':
      return emptyCart
    case 'replace':
      return action.state
  }
}

export function selectItemCount(state: CartState): number {
  return state.items.reduce((count, item) => count + item.quantity, 0)
}

export function selectSubtotalCents(state: CartState): number {
  return state.items.reduce((total, item) => total + item.priceCents * item.quantity, 0)
}
