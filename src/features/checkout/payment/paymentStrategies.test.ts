import { describe, expect, it } from 'vitest'
import { CreditCardFields } from './CreditCardFields'
import { getInstallmentOptions } from './installments'
import { getPaymentStrategy, paymentStrategies } from './paymentStrategies'

describe('paymentStrategies', () => {
  it('lista cartão, Pix e boleto nessa ordem', () => {
    expect(paymentStrategies.map((strategy) => strategy.method)).toEqual([
      'credit_card',
      'pix',
      'boleto',
    ])
  })

  it('Pix dá 5% de desconto, arredondando para o centavo', () => {
    const pix = getPaymentStrategy('pix')

    expect(pix.label).toBe('Pix')
    expect(pix.computeTotalCents(10000)).toBe(9500)
    expect(pix.computeTotalCents(999)).toBe(949)
  })

  it('cartão e boleto cobram o subtotal', () => {
    expect(getPaymentStrategy('credit_card').computeTotalCents(10000)).toBe(10000)
    expect(getPaymentStrategy('boleto').computeTotalCents(10000)).toBe(10000)
  })

  it('só o cartão tem campos próprios', () => {
    expect(getPaymentStrategy('credit_card').Fields).toBe(CreditCardFields)
    expect(getPaymentStrategy('pix').Fields).toBeNull()
    expect(getPaymentStrategy('boleto').Fields).toBeNull()
  })

  it('os valores padrão de cada forma de pagamento têm o próprio método', () => {
    for (const strategy of paymentStrategies) {
      expect(strategy.defaultValues.method).toBe(strategy.method)
    }
  })
})

describe('getInstallmentOptions', () => {
  it('vai de 1 a 12 parcelas, arredondando a parcela para cima', () => {
    const options = getInstallmentOptions(10000)

    expect(options).toHaveLength(12)
    expect(options[0]).toEqual({ count: 1, amountCents: 10000 })
    expect(options[2]).toEqual({ count: 3, amountCents: 3334 })
    expect(options[11]).toEqual({ count: 12, amountCents: 834 })
  })
})
