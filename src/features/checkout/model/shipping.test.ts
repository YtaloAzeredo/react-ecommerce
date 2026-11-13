import { describe, expect, it } from 'vitest'
import { FREE_SHIPPING_FROM_CENTS, quoteShipping } from './shipping'

describe('quoteShipping', () => {
  it('cobra por zona do primeiro dígito do CEP', () => {
    const near = { costCents: 990, deliveryDays: 3 }
    const mid = { costCents: 1990, deliveryDays: 6 }
    const far = { costCents: 2990, deliveryDays: 10 }
    for (const cep of ['01310-100', '13010000', '20040-020', '30130000', '80010-000', '90010000']) {
      expect(quoteShipping(cep, 10000), cep).toEqual(near)
    }
    for (const cep of ['40020-000', '50010000', '70040-010']) {
      expect(quoteShipping(cep, 10000), cep).toEqual(mid)
    }
    expect(quoteShipping('69005-000', 10000)).toEqual(far)
  })

  it('não cota CEP sem 8 dígitos', () => {
    expect(quoteShipping('0131010', 10000)).toBeNull()
    expect(quoteShipping('', 10000)).toBeNull()
    expect(quoteShipping('01310-1000', 10000)).toBeNull()
  })

  it('é grátis a partir de US$ 300,00 de subtotal, com o prazo da zona', () => {
    expect(FREE_SHIPPING_FROM_CENTS).toBe(30000)
    expect(quoteShipping('69005-000', 30000)).toEqual({ costCents: 0, deliveryDays: 10 })
    expect(quoteShipping('69005-000', 29999)).toEqual({ costCents: 2990, deliveryDays: 10 })
  })
})
