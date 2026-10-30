import type { CartItem } from '@/features/cart/model/cartReducer'
import { onlyDigits } from '../model/masks'
import type { CheckoutFormValues, PaymentMethod } from '../model/checkoutSchema'

export interface OrderRequest extends CheckoutFormValues {
  items: CartItem[]
  totalCents: number
}

export interface OrderConfirmation {
  orderId: string
  totalCents: number
  paymentMethod: PaymentMethod
}

// Cartão de teste que a "operadora" sempre recusa, para dar para ver o tratamento de erro.
export const DECLINED_CARD_NUMBER = '4000000000000002'

export class PaymentDeclinedError extends Error {
  constructor() {
    super('Pagamento recusado pela operadora do cartão.')
    this.name = 'PaymentDeclinedError'
  }
}

// Não existe backend: o pedido é "enviado" com uma espera que imita a rede, para o formulário
// mostrar o estado de envio de verdade.
export async function submitOrder(
  order: OrderRequest,
  { delayMs = 1000 }: { delayMs?: number } = {},
): Promise<OrderConfirmation> {
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  if (order.items.length === 0) throw new Error('Carrinho vazio')
  if (
    order.payment.method === 'credit_card' &&
    onlyDigits(order.payment.cardNumber) === DECLINED_CARD_NUMBER
  ) {
    throw new PaymentDeclinedError()
  }

  return {
    orderId: crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase(),
    totalCents: order.totalCents,
    paymentMethod: order.payment.method,
  }
}
