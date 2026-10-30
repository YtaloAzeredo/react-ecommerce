import { Link, Navigate, useLocation } from 'react-router'
import { formatPrice } from '@/shared/lib/formatPrice'
import type { OrderConfirmation } from '../api/orderService'
import { getPaymentStrategy, paymentStrategies } from '../payment/paymentStrategies'

// O pedido chega pelo estado da navegação, que pode estar vazio (link aberto direto) ou ter vindo de
// outra versão do app; só um pedido completo é mostrado.
function isOrderConfirmation(value: unknown): value is OrderConfirmation {
  if (typeof value !== 'object' || value === null) return false
  const { orderId, totalCents, paymentMethod } = value as Record<string, unknown>
  return (
    typeof orderId === 'string' &&
    typeof totalCents === 'number' &&
    paymentStrategies.some((strategy) => strategy.method === paymentMethod)
  )
}

export function OrderSuccessPage() {
  const { state } = useLocation()
  if (!isOrderConfirmation(state)) return <Navigate to="/" replace />
  const { orderId, totalCents, paymentMethod } = state

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-2xl font-bold">Pedido confirmado!</h1>
      <p className="text-slate-600">Esta loja é uma demonstração: nenhum valor foi cobrado.</p>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left">
        <dt className="text-slate-600">Número do pedido</dt>
        <dd className="font-mono font-semibold">{orderId}</dd>
        <dt className="text-slate-600">Total</dt>
        <dd className="font-semibold">{formatPrice(totalCents)}</dd>
        <dt className="text-slate-600">Pagamento</dt>
        <dd>{getPaymentStrategy(paymentMethod).label}</dd>
      </dl>
      <Link
        to="/"
        className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
      >
        Continuar comprando
      </Link>
    </section>
  )
}
