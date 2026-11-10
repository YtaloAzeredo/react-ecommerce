import { useId, useState } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '@/shared/lib/formatPrice'
import type { CartItem } from '../model/cartReducer'
import { useCart } from '../useCart'

const stepButtonClass =
  'size-9 rounded-md border border-slate-300 bg-white text-lg leading-none hover:bg-slate-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-40'

export function CartLineItem({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const { setQuantity, remove } = useCart()
  const { productId, title, priceCents, thumbnailUrl, maxQuantity, quantity } = item
  const [draft, setDraft] = useState<string | null>(null)
  const [overflow, setOverflow] = useState<number | null>(null)
  const limitId = useId()
  const atLimit = quantity >= maxQuantity
  if (overflow !== null && !atLimit) setOverflow(null)
  const limitMessage =
    overflow === null
      ? `Só há ${maxQuantity} em estoque.`
      : `Só há ${maxQuantity} em estoque, não ${overflow}.`

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
          <p className="font-semibold whitespace-nowrap">
            <span className="sr-only">Total: </span>
            {formatPrice(priceCents * quantity)}
          </p>
        </div>
        <p className="text-sm text-slate-600">{formatPrice(priceCents)} cada</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={`Diminuir quantidade de ${title}`}
            aria-disabled={quantity <= 1 || undefined}
            onClick={() => {
              if (quantity > 1) setQuantity(productId, quantity - 1)
            }}
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
            aria-describedby={atLimit ? limitId : undefined}
            value={draft ?? quantity}
            onChange={(event) => {
              const value = event.target.value
              const next = Number(value)
              if (value !== '' && Number.isInteger(next) && next >= 1) {
                setOverflow(next > maxQuantity ? next : null)
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
            aria-disabled={atLimit || undefined}
            aria-describedby={atLimit ? limitId : undefined}
            onClick={() => {
              if (!atLimit) setQuantity(productId, quantity + 1)
            }}
            className={stepButtonClass}
          >
            +
          </button>
          <button
            type="button"
            aria-label={`Remover ${title}`}
            onClick={() => {
              remove(productId)
              onRemove()
            }}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Remover
          </button>
        </div>
        <p id={limitId} role="status" className={atLimit ? 'text-sm text-slate-600' : 'sr-only'}>
          {atLimit && limitMessage}
        </p>
      </div>
    </li>
  )
}
