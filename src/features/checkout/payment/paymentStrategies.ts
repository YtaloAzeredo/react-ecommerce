import type { ComponentType } from 'react'
import type { CheckoutFormValues, PaymentMethod } from '../model/checkoutSchema'
import { CreditCardFields } from './CreditCardFields'

// Strategy: tudo o que muda de uma forma de pagamento para outra fica num objeto só. O checkout não
// tem um `if (method === 'pix')`; ele pergunta à estratégia escolhida.
export interface PaymentStrategy {
  method: PaymentMethod
  label: string
  description: string
  defaultValues: CheckoutFormValues['payment']
  computeTotalCents(subtotalCents: number): number
  Fields: ComponentType<{ totalCents: number }> | null
}

const strategies = {
  credit_card: {
    method: 'credit_card',
    label: 'Cartão de crédito',
    description: 'Em até 12x sem juros',
    defaultValues: {
      method: 'credit_card',
      cardNumber: '',
      cardName: '',
      expiry: '',
      cvv: '',
      installments: 1,
    },
    computeTotalCents: (subtotalCents) => subtotalCents,
    Fields: CreditCardFields,
  },
  pix: {
    method: 'pix',
    label: 'Pix',
    description: '5% de desconto',
    defaultValues: { method: 'pix' },
    computeTotalCents: (subtotalCents) => Math.round(subtotalCents * 0.95),
    Fields: null,
  },
  boleto: {
    method: 'boleto',
    label: 'Boleto',
    description: 'Vence em 3 dias úteis',
    defaultValues: { method: 'boleto' },
    computeTotalCents: (subtotalCents) => subtotalCents,
    Fields: null,
  },
} satisfies Record<PaymentMethod, PaymentStrategy>

export const paymentStrategies: readonly PaymentStrategy[] = [
  strategies.credit_card,
  strategies.pix,
  strategies.boleto,
]

export function getPaymentStrategy(method: PaymentMethod): PaymentStrategy {
  return strategies[method]
}
