import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-slate-600">O endereço que você abriu não existe.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
      >
        Voltar para a loja
      </Link>
    </section>
  )
}
