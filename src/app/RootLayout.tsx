import { Link, Outlet, ScrollRestoration } from 'react-router'
import { CartLink } from '@/features/cart/components/CartLink'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Vitrine
          </Link>
          <CartLink />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      {/* Volta à mesma posição de rolagem ao usar o Voltar; navegação nova começa no topo. */}
      <ScrollRestoration />
    </div>
  )
}
