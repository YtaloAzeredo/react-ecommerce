import { Link } from 'react-router'
import { useCart } from '../useCart'

export function CartLink() {
  const { itemCount } = useCart()

  return (
    <Link
      to="/cart"
      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
    >
      Carrinho
      <span
        aria-hidden="true"
        className="min-w-6 rounded-full bg-slate-900 px-2 py-0.5 text-center text-xs font-semibold text-white"
      >
        {itemCount}
      </span>{' '}
      <span className="sr-only">{`(${itemCount} ${itemCount === 1 ? 'item' : 'itens'})`}</span>
    </Link>
  )
}
