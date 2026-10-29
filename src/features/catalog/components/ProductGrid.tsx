import type { Product } from '../model/types'
import { ProductCard } from './ProductCard'

// busy: a próxima página está carregando e esta ainda é a anterior (placeholder do cache).
export function ProductGrid({ products, busy }: { products: Product[]; busy: boolean }) {
  return (
    <ul
      aria-busy={busy}
      className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 lg:grid-cols-4 ${busy ? 'opacity-50' : ''}`}
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
