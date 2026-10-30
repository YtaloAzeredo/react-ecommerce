import { describe, expect, it } from 'vitest'
import { makeCartItem } from '@/test/fixtures'
import { emptyCart } from './cartReducer'
import { CART_STORAGE_KEY, loadCart, saveCart } from './cartStorage'

describe('cartStorage', () => {
  it('sem nada salvo, carrega o carrinho vazio', () => {
    expect(loadCart()).toEqual(emptyCart)
  })

  it('salvar e carregar devolve o mesmo estado', () => {
    const state = {
      items: [makeCartItem({ productId: 1, quantity: 2 }), makeCartItem({ productId: 2 })],
    }

    saveCart(state)

    expect(loadCart()).toEqual(state)
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '')).toEqual(state)
  })

  it('JSON inválido vira carrinho vazio', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{nao é json')

    expect(loadCart()).toEqual(emptyCart)
  })

  it('items que não é lista vira carrinho vazio', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{"items":"x"}')

    expect(loadCart()).toEqual(emptyCart)
  })

  it('formato antigo (array solto) vira carrinho vazio', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([makeCartItem()]))

    expect(loadCart()).toEqual(emptyCart)
  })

  it('item com quantity 0 ou negativa é descartado no carregamento', () => {
    const valid = makeCartItem({ productId: 3, quantity: 1 })
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: [
          makeCartItem({ productId: 1, quantity: 0 }),
          makeCartItem({ productId: 2, quantity: -2 }),
          valid,
        ],
      }),
    )

    expect(loadCart()).toEqual({ items: [valid] })
  })

  it('item com campos faltando é descartado no carregamento', () => {
    const valid = makeCartItem({ productId: 2 })
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: [{ productId: 1, quantity: 1 }, valid] }),
    )

    expect(loadCart()).toEqual({ items: [valid] })
  })

  it('quantidade salva acima do estoque é limitada ao estoque', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: [makeCartItem({ maxQuantity: 2, quantity: 9 })] }),
    )

    expect(loadCart().items[0].quantity).toBe(2)
  })

  it('storage que lança erro não quebra', () => {
    const failing = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('cheio')
      },
    } as unknown as Storage

    expect(loadCart(failing)).toEqual(emptyCart)
    expect(() => saveCart({ items: [makeCartItem()] }, failing)).not.toThrow()
  })
})
