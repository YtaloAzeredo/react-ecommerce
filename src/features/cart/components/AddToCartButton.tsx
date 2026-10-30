import { useState } from 'react'
import { Link } from 'react-router'
import type { Product } from '@/features/catalog/model/types'
import { useCart } from '../useCart'

export function AddToCartButton({ product }: { product: Product }) {
  const { items, add } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.find((item) => item.productId === product.id)?.quantity ?? 0
  const soldOut = product.stock <= 0
  const atLimit = !soldOut && inCart >= product.stock

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={soldOut || atLimit}
        onClick={() => {
          add(product)
          setAdded(true)
        }}
        className="self-start rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        {soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}
      </button>
      {atLimit && (
        <p className="text-sm text-slate-600">Todo o estoque deste produto já está no carrinho.</p>
      )}
      {/* A região fica sempre na página: leitores de tela só anunciam mudanças numa região que já existia. */}
      <p role="status" className="text-sm text-green-700">
        {added && (
          <>
            Adicionado ao carrinho.{' '}
            <Link to="/cart" className="font-medium underline">
              Ver carrinho
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
