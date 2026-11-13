import type { Product } from '../model/types'
import { ProductCard } from './ProductCard'

const EAGER_IMAGES = 4

export function ProductGrid({ products, busy }: { products: Product[]; busy: boolean }) {
  return (
    <ul
      aria-busy={busy}
      className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 lg:grid-cols-4 ${busy ? 'opacity-50' : ''}`}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} eager={index < EAGER_IMAGES} />
        </li>
      ))}
    </ul>
  )
}
