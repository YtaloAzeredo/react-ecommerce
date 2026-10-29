import { Link, Navigate, useNavigate } from 'react-router'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { CategoryFilter } from '../components/CategoryFilter'
import { ProductGrid } from '../components/ProductGrid'
import { useCatalogParams } from '../hooks/useCatalogParams'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'

const buttonClass = 'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700'

export function CatalogPage() {
  const { page, category, hrefFor } = useCatalogParams()
  const navigate = useNavigate()
  const products = useProducts({ page, category })
  const categories = useCategories()

  const categoryName = categories.data?.find((item) => item.slug === category)?.name
  const title = category ? (categoryName ?? category) : 'Produtos'

  // Página além do fim (link antigo ou digitado): troca a URL pela última página sem empilhar histórico.
  if (products.data && !products.isPlaceholderData && page > products.data.totalPages) {
    return <Navigate to={hrefFor({ page: products.data.totalPages })} replace />
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <CategoryFilter
          categories={categories.data ?? []}
          value={category}
          onChange={(slug) => navigate(hrefFor({ category: slug }))}
        />
      </div>

      {products.isPending ? (
        <StatusMessage>Carregando produtos…</StatusMessage>
      ) : products.isError ? (
        <StatusMessage
          tone="error"
          action={
            <button type="button" className={buttonClass} onClick={() => products.refetch()}>
              Tentar novamente
            </button>
          }
        >
          Não foi possível carregar os produtos.
        </StatusMessage>
      ) : products.data.total === 0 ? (
        <StatusMessage
          action={
            <Link to="/" className={buttonClass}>
              Ver todos os produtos
            </Link>
          }
        >
          Nenhum produto encontrado.
        </StatusMessage>
      ) : (
        <>
          <ProductGrid products={products.data.items} busy={products.isPlaceholderData} />
          <Pagination
            page={page}
            totalPages={products.data.totalPages}
            getHref={(target) => hrefFor({ page: target })}
          >
            <Pagination.Previous />
            <Pagination.Items />
            <Pagination.Next />
          </Pagination>
        </>
      )}
    </section>
  )
}
