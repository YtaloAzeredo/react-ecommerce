import { Link } from 'react-router'
import { formatPrice } from '@/shared/lib/formatPrice'
import type { Product } from '../model/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
    >
      {/* alt vazio: o título logo abaixo já descreve o produto, e o link não fica com o nome repetido. */}
      <img
        src={product.thumbnailUrl}
        alt=""
        loading="lazy"
        className="aspect-square w-full object-contain"
      />
      <h2 className="mt-3 line-clamp-2 font-medium">{product.title}</h2>
      <p className="mt-auto pt-2 font-semibold">{formatPrice(product.priceCents)}</p>
    </Link>
  )
}
