import { useState } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '@/shared/lib/formatPrice'
import type { CartItem } from '../model/cartReducer'
import { useCart } from '../useCart'

const stepButtonClass =
  'size-9 rounded-md border border-slate-300 bg-white text-lg leading-none hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

export function CartLineItem({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart()
  const { productId, title, priceCents, thumbnailUrl, maxQuantity, quantity } = item
  // Texto em edição no campo de quantidade; null mostra a quantidade do carrinho.
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <li className="flex gap-4 py-4">
      <img
        src={thumbnailUrl}
        alt=""
        className="size-20 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
      />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/products/${productId}`} className="font-medium hover:underline">
            {title}
          </Link>
          <p className="font-semibold whitespace-nowrap">{formatPrice(priceCents * quantity)}</p>
        </div>
        <p className="text-sm text-slate-600">{formatPrice(priceCents)} cada</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={`Diminuir quantidade de ${title}`}
            disabled={quantity <= 1}
            onClick={() => setQuantity(productId, quantity - 1)}
            className={stepButtonClass}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            aria-label={`Quantidade de ${title}`}
            value={draft ?? quantity}
            onChange={(event) => {
              const value = event.target.value
              const next = Number(value)
              // Só número inteiro positivo chega ao carrinho: o campo vazio no meio da digitação não
              // pode remover o item (para isso existe o "Remover").
              if (value !== '' && Number.isInteger(next) && next >= 1) {
                setQuantity(productId, next)
                setDraft(null)
              } else {
                setDraft(value)
              }
            }}
            onBlur={() => setDraft(null)}
            className="h-9 w-16 rounded-md border border-slate-300 bg-white px-2 text-center"
          />
          <button
            type="button"
            aria-label={`Aumentar quantidade de ${title}`}
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity(productId, quantity + 1)}
            className={stepButtonClass}
          >
            +
          </button>
          <button
            type="button"
            aria-label={`Remover ${title}`}
            onClick={() => remove(productId)}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  )
}
