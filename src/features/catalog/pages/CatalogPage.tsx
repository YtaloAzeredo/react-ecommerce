import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { isModifiedClick } from '@/shared/lib/isModifiedClick'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { CategoryFilter } from '../components/CategoryFilter'
import { ProductGrid } from '../components/ProductGrid'
import { SearchForm } from '../components/SearchForm'
import { useCatalogParams } from '../hooks/useCatalogParams'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import { findKnownTotalPages } from '../queries'

const buttonClass =
  'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60'

export function CatalogPage() {
  const { page, category, search, hrefFor } = useCatalogParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const products = useProducts({ page, category, search })
  const categories = useCategories()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const categorySelectRef = useRef<HTMLSelectElement>(null)
  const [retrying, setRetrying] = useState(false)
  const focusTitleWhenLoaded = useRef(false)
  const loaded = products.isSuccess && !products.isPlaceholderData

  useEffect(() => {
    if (!focusTitleWhenLoaded.current) return
    if (loaded) headingRef.current?.focus()
    if (loaded || products.isError) focusTitleWhenLoaded.current = false
  }, [loaded, products.isError, search, category])

  const categoryName = categories.data?.find((item) => item.slug === category)?.name
  const title = search
    ? `Resultados para “${search}”`
    : category
      ? (categoryName ?? category)
      : 'Produtos'

  if (products.data && !products.isPlaceholderData && page > products.data.totalPages) {
    return <Navigate to={hrefFor({ page: products.data.totalPages })} replace />
  }

  const knownTotalPages =
    products.data?.totalPages ?? findKnownTotalPages(queryClient, { category, search })

  const paginationFor = (totalPages: number) => (
    <Pagination page={page} totalPages={totalPages} getHref={(target) => hrefFor({ page: target })}>
      <Pagination.Previous />
      <Pagination.Items />
      <Pagination.Next />
    </Pagination>
  )

  return (
    <section className="flex flex-col gap-6">
      <SearchForm
        value={search}
        onSearch={(term) => {
          focusTitleWhenLoaded.current = true
          navigate(hrefFor({ search: term }))
        }}
        onEdit={() => {
          focusTitleWhenLoaded.current = false
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
          {title}
        </h1>
        <CategoryFilter
          ref={categorySelectRef}
          categories={categories.data ?? []}
          value={category}
          onChange={(slug) => navigate(hrefFor({ category: slug }))}
        />
      </div>

      {categories.isError && !categories.data && (
        <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
          Não foi possível carregar as categorias.
          <button
            type="button"
            onClick={() => {
              categorySelectRef.current?.focus()
              void categories.refetch()
            }}
            className="font-medium underline"
          >
            Recarregar categorias
          </button>
        </p>
      )}

      {products.isError && products.data && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p>
            {products.isFetching ? 'Tentando novamente…' : 'Não foi possível atualizar a lista.'}
          </p>
          <button
            type="button"
            className={buttonClass}
            aria-disabled={products.isFetching || undefined}
            onClick={() => {
              if (products.isFetching) return
              void products.refetch().then((result) => {
                if (!result.isError) headingRef.current?.focus()
              })
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {products.isPending && !retrying ? (
        <StatusMessage>Carregando produtos…</StatusMessage>
      ) : !products.data || (retrying && products.isPlaceholderData) ? (
        <>
          <StatusMessage
            tone="error"
            action={
              <button
                type="button"
                className={buttonClass}
                aria-disabled={retrying || undefined}
                onClick={() => {
                  if (retrying) return
                  setRetrying(true)
                  void products.refetch().then((result) => {
                    setRetrying(false)
                    if (!result.isError) headingRef.current?.focus()
                  })
                }}
              >
                Tentar novamente
              </button>
            }
          >
            {retrying ? 'Tentando novamente…' : 'Não foi possível carregar os produtos.'}
          </StatusMessage>
          {knownTotalPages !== undefined &&
            page <= knownTotalPages &&
            paginationFor(knownTotalPages)}
        </>
      ) : products.data.total === 0 ? (
        <StatusMessage
          action={
            <Link
              to="/"
              onClick={(event) => {
                if (!isModifiedClick(event)) focusTitleWhenLoaded.current = true
              }}
              className={buttonClass}
            >
              Ver todos os produtos
            </Link>
          }
        >
          {search ? `Nenhum produto encontrado para “${search}”.` : 'Nenhum produto encontrado.'}
        </StatusMessage>
      ) : (
        <>
          <ProductGrid products={products.data.items} busy={products.isPlaceholderData} />
          {paginationFor(products.data.totalPages)}
        </>
      )}
    </section>
  )
}
