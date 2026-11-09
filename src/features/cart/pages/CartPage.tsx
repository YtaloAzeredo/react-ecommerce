import { useId, useRef } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '@/shared/lib/formatPrice'
import { CartLineItem } from '../components/CartLineItem'
import { useCart } from '../useCart'

const buttonClass = 'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700'

export function CartPage() {
  const { items, subtotalCents } = useCart()
  const summaryTitleId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)

  return (
    <section className="flex flex-col gap-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
        Carrinho
      </h1>
      <div
        role="status"
        className={
          items.length === 0 ? 'flex flex-col items-center gap-4 py-16 text-center' : 'sr-only'
        }
      >
        {items.length === 0 && (
          <>
            <p className="text-slate-600">Seu carrinho está vazio.</p>
            <Link to="/" className={buttonClass}>
              Ver produtos
            </Link>
          </>
        )}
      </div>
      {items.length > 0 && (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white px-4">
            {items.map((item) => (
              <CartLineItem
                key={item.productId}
                item={item}
                onRemove={() => headingRef.current?.focus()}
              />
            ))}
          </ul>
          <section
            aria-labelledby={summaryTitleId}
            className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <h2 id={summaryTitleId} className="text-lg font-semibold">
              Resumo
            </h2>
            <dl aria-live="polite" aria-atomic="true" className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{formatPrice(subtotalCents)}</dd>
            </dl>
            <Link to="/checkout" className={`${buttonClass} text-center`}>
              Finalizar compra
            </Link>
          </section>
        </div>
      )}
    </section>
  )
}
