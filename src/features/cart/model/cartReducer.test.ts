import { describe, expect, it } from 'vitest'
import { makeCartItem } from '@/test/fixtures'
import {
  cartReducer,
  emptyCart,
  selectItemCount,
  selectSubtotalCents,
  type CartItem,
} from './cartReducer'

function withoutQuantity({ quantity: _quantity, ...item }: CartItem) {
  return item
}

describe('cartReducer', () => {
  it('add de produto novo cria o item com quantidade 1', () => {
    const item = makeCartItem({ productId: 1 })

    const state = cartReducer(emptyCart, { type: 'add', item: withoutQuantity(item) })

    expect(state.items).toEqual([{ ...item, quantity: 1 }])
  })

  it('add de produto novo usa a quantidade informada', () => {
    const state = cartReducer(emptyCart, {
      type: 'add',
      item: withoutQuantity(makeCartItem()),
      quantity: 3,
    })

    expect(state.items[0].quantity).toBe(3)
  })

  it('add de produto existente soma as quantidades', () => {
    const item = makeCartItem({ quantity: 2 })

    const state = cartReducer(
      { items: [item] },
      { type: 'add', item: withoutQuantity(item), quantity: 3 },
    )

    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(5)
  })

  it('add respeita o estoque', () => {
    const state = cartReducer(emptyCart, {
      type: 'add',
      item: withoutQuantity(makeCartItem({ maxQuantity: 3 })),
      quantity: 5,
    })

    expect(state.items[0].quantity).toBe(3)
  })

  it('add de produto sem estoque devolve o mesmo estado', () => {
    const state = { items: [makeCartItem({ productId: 2 })] }

    const next = cartReducer(state, {
      type: 'add',
      item: withoutQuantity(makeCartItem({ productId: 1, maxQuantity: 0 })),
    })

    expect(next).toBe(state)
  })

  it('add com quantidade menor que 1 devolve o mesmo estado', () => {
    const item = makeCartItem({ quantity: 2 })
    const state = { items: [item] }

    expect(cartReducer(state, { type: 'add', item: withoutQuantity(item), quantity: 0 })).toBe(
      state,
    )
    expect(cartReducer(state, { type: 'add', item: withoutQuantity(item), quantity: -1 })).toBe(
      state,
    )
  })

  it('add de produto existente atualiza preço e estoque', () => {
    const state = { items: [makeCartItem({ priceCents: 999, maxQuantity: 10, quantity: 1 })] }

    const next = cartReducer(state, {
      type: 'add',
      item: withoutQuantity(makeCartItem({ priceCents: 1299, maxQuantity: 4 })),
    })

    expect(next.items[0]).toMatchObject({ priceCents: 1299, maxQuantity: 4, quantity: 2 })
  })

  it('add não altera o estado anterior', () => {
    const item = makeCartItem({ quantity: 1 })
    const state = { items: [item] }

    cartReducer(state, { type: 'add', item: withoutQuantity(item) })

    expect(state.items[0]).toBe(item)
    expect(item.quantity).toBe(1)
  })

  it('setQuantity muda a quantidade', () => {
    const state = cartReducer(
      { items: [makeCartItem({ productId: 1, quantity: 1 })] },
      { type: 'setQuantity', productId: 1, quantity: 4 },
    )

    expect(state.items[0].quantity).toBe(4)
  })

  it('setQuantity 0 remove o item', () => {
    const state = cartReducer(
      { items: [makeCartItem({ productId: 1 }), makeCartItem({ productId: 2 })] },
      { type: 'setQuantity', productId: 1, quantity: 0 },
    )

    expect(state.items.map((item) => item.productId)).toEqual([2])
  })

  it('setQuantity acima do estoque limita ao estoque', () => {
    const state = cartReducer(
      { items: [makeCartItem({ productId: 1, maxQuantity: 5 })] },
      { type: 'setQuantity', productId: 1, quantity: 99 },
    )

    expect(state.items[0].quantity).toBe(5)
  })

  it('setQuantity arredonda para baixo', () => {
    const state = cartReducer(
      { items: [makeCartItem({ productId: 1 })] },
      { type: 'setQuantity', productId: 1, quantity: 2.7 },
    )

    expect(state.items[0].quantity).toBe(2)
  })

  it('remove tira o item', () => {
    const state = cartReducer(
      { items: [makeCartItem({ productId: 1 }), makeCartItem({ productId: 2 })] },
      { type: 'remove', productId: 2 },
    )

    expect(state.items.map((item) => item.productId)).toEqual([1])
  })

  it('replace troca o carrinho inteiro', () => {
    const replacement = { items: [makeCartItem({ productId: 2 })] }

    const state = cartReducer(
      { items: [makeCartItem({ productId: 1 })] },
      { type: 'replace', state: replacement },
    )

    expect(state).toBe(replacement)
  })

  it('clear esvazia o carrinho', () => {
    const state = cartReducer({ items: [makeCartItem()] }, { type: 'clear' })

    expect(state.items).toEqual([])
  })
})

describe('seletores', () => {
  const state = {
    items: [
      makeCartItem({ productId: 1, priceCents: 999, quantity: 2 }),
      makeCartItem({ productId: 2, priceCents: 1500, quantity: 1 }),
    ],
  }

  it('selectSubtotalCents soma preço × quantidade', () => {
    expect(selectSubtotalCents(state)).toBe(3498)
  })

  it('selectItemCount soma as quantidades', () => {
    expect(selectItemCount(state)).toBe(3)
  })

  it('carrinho vazio tem subtotal e contagem zero', () => {
    expect(selectSubtotalCents(emptyCart)).toBe(0)
    expect(selectItemCount(emptyCart)).toBe(0)
  })
})
