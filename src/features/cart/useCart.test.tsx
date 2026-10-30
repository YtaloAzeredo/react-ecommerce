import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { toProduct } from '@/features/catalog/api/productAdapter'
import { makeProductDto } from '@/test/fixtures'
import { CartProvider } from './CartProvider'
import { CART_STORAGE_KEY, loadCart } from './model/cartStorage'
import { useCart } from './useCart'

// O navegador avisa as outras abas com o evento storage; no jsdom só existe esta janela, então o
// evento é disparado à mão (key null é o que chega quando a outra aba chama localStorage.clear()).
function notifyOtherTabs(key: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key }))
  })
}

describe('useCart', () => {
  it('persiste e recarrega', () => {
    const first = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => first.result.current.add(toProduct(makeProductDto({ id: 1 }))))
    first.unmount()

    const second = renderHook(() => useCart(), { wrapper: CartProvider })

    expect(second.result.current.itemCount).toBe(1)
    expect(second.result.current.items[0].title).toBe('Produto 1')
  })

  it('adicionar converte o produto e usa o estoque como limite', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })

    act(() => result.current.add(toProduct(makeProductDto({ id: 1, price: 9.99, stock: 2 })), 5))

    expect(result.current.items).toEqual([
      {
        productId: 1,
        title: 'Produto 1',
        priceCents: 999,
        thumbnailUrl: 'https://cdn.example.com/1/thumbnail.webp',
        maxQuantity: 2,
        quantity: 2,
      },
    ])
    expect(result.current.subtotalCents).toBe(1998)
  })

  it('acompanha o carrinho alterado em outra aba', () => {
    const tabA = renderHook(() => useCart(), { wrapper: CartProvider })
    const tabB = renderHook(() => useCart(), { wrapper: CartProvider })

    act(() => tabA.result.current.add(toProduct(makeProductDto({ id: 1 }))))
    notifyOtherTabs(CART_STORAGE_KEY)

    expect(tabB.result.current.items.map((item) => item.productId)).toEqual([1])

    act(() => tabB.result.current.add(toProduct(makeProductDto({ id: 2 }))))

    expect(loadCart().items.map((item) => item.productId)).toEqual([1, 2])
  })

  it('outra aba limpando o storage esvazia o carrinho', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => result.current.add(toProduct(makeProductDto({ id: 1 }))))

    localStorage.clear()
    notifyOtherTabs(null)

    expect(result.current.itemCount).toBe(0)
  })

  it('fora do provider lança erro', () => {
    // O React registra o erro de renderização no console; aqui ele é esperado.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useCart())).toThrow(
      'useCart precisa estar dentro de <CartProvider>',
    )
  })
})
