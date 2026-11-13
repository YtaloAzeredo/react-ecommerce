import { useId } from 'react'
import type { CartItem } from '@/features/cart/model/cartReducer'
import { formatPrice } from '@/shared/lib/formatPrice'

export function OrderSummary({
  items,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
}: {
  items: CartItem[]
  subtotalCents: number
  discountCents: number
  shippingCents: number | null
  totalCents: number
}) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        Resumo do pedido
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-4">
            <span>
              {item.quantity}× {item.title}
            </span>
            <span className="whitespace-nowrap">
              <span className="sr-only">Total do item: </span>
              {formatPrice(item.priceCents * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-slate-200 pt-4">
        <dt>Subtotal</dt>
        <dd>{formatPrice(subtotalCents)}</dd>
        {discountCents > 0 && (
          <>
            <dt>Desconto</dt>
            <dd className="text-green-700">{formatPrice(-discountCents)}</dd>
          </>
        )}
        <dt>Frete</dt>
        <dd className={shippingCents === 0 ? 'text-green-700' : ''}>
          {shippingCents === null
            ? 'a calcular'
            : shippingCents === 0
              ? 'Grátis'
              : formatPrice(shippingCents)}
        </dd>
        <dt className="font-semibold">Total</dt>
        <dd className="font-semibold">{formatPrice(totalCents)}</dd>
      </dl>
    </section>
  )
}
