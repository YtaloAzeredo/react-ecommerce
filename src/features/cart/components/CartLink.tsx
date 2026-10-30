import { Link } from 'react-router'
import { useCart } from '../useCart'

export function CartLink() {
  const { itemCount } = useCart()
  const label = `Carrinho (${itemCount} ${itemCount === 1 ? 'item' : 'itens'})`

  return (
    <Link
      to="/cart"
      aria-label={label}
      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
    >
      Carrinho
      <span className="min-w-6 rounded-full bg-slate-900 px-2 py-0.5 text-center text-xs font-semibold text-white">
        {itemCount}
      </span>
    </Link>
  )
}
