import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeCartItem } from '@/test/fixtures'
import { PaymentDeclinedError, submitOrder, type OrderRequest } from './orderService'

const pixOrder: OrderRequest = {
  customer: {
    fullName: 'Ana Souza',
    email: 'ana@example.com',
    cpf: '529.982.247-25',
    phone: '(11) 98765-4321',
  },
  address: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  payment: { method: 'pix' },
  items: [makeCartItem({ priceCents: 10000 })],
  totalCents: 9500,
}

function cardOrder(cardNumber: string): OrderRequest {
  return {
    ...pixOrder,
    payment: {
      method: 'credit_card',
      cardNumber,
      cardName: 'ANA SOUZA',
      expiry: '12/99',
      cvv: '123',
      installments: 1,
    },
    totalCents: 10000,
  }
}

describe('submitOrder', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('Pix é aprovado', async () => {
    const confirmation = await submitOrder(pixOrder, { delayMs: 0 })

    expect(confirmation).toEqual({
      orderId: expect.stringMatching(/^[0-9A-F]{8}$/),
      totalCents: 9500,
      paymentMethod: 'pix',
    })
  })

  it('cartão comum é aprovado', async () => {
    const confirmation = await submitOrder(cardOrder('4242 4242 4242 4242'), { delayMs: 0 })

    expect(confirmation).toMatchObject({ totalCents: 10000, paymentMethod: 'credit_card' })
  })

  it('cartão de teste recusado', async () => {
    const result = submitOrder(cardOrder('4000 0000 0000 0002'), { delayMs: 0 })

    await expect(result).rejects.toBeInstanceOf(PaymentDeclinedError)
    await expect(result).rejects.toThrow('Pagamento recusado pela operadora do cartão.')
  })

  it('carrinho vazio rejeita', async () => {
    await expect(submitOrder({ ...pixOrder, items: [] }, { delayMs: 0 })).rejects.toThrow(
      'Carrinho vazio',
    )
  })

  it('responde só depois da espera', async () => {
    vi.useFakeTimers()
    let settled = false
    const result = submitOrder(pixOrder).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await result
    expect(settled).toBe(true)
  })
})
