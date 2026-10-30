import { Link, Outlet, ScrollRestoration, useNavigation } from 'react-router'
import { CartLink } from '@/features/cart/components/CartLink'

export function RootLayout() {
  // Ao abrir uma rota sob demanda, a página atual fica na tela até o código da próxima chegar; sem
  // um aviso, numa rede lenta o clique pareceria não ter funcionado.
  const loading = useNavigation().state === 'loading'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        aria-hidden="true"
        className={`fixed inset-x-0 top-0 h-1 bg-slate-900 transition-opacity ${loading ? 'animate-pulse opacity-100' : 'opacity-0'}`}
      />
      {/* Sempre na página: leitores de tela só anunciam mudanças numa região que já existia. */}
      <p role="status" className="sr-only">
        {loading ? 'Carregando página…' : ''}
      </p>
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
