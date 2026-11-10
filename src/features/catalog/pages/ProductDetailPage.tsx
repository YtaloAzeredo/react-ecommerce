import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type MouseEvent, type Ref } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'
import { isNotFound } from '@/shared/api/http'
import { formatPrice } from '@/shared/lib/formatPrice'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { useProduct } from '../hooks/useProduct'
import type { Product } from '../model/types'
import { findProductInLists } from '../queries'

const buttonClass =
  'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60'

const ratingFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function ProductDetailPage() {
  const { productId = '' } = useParams()
  return (
    <article className="flex flex-col gap-6">
      <BackLink />
      {/^\d+$/.test(productId) ? (
        <ProductDetail key={productId} id={Number(productId)} />
      ) : (
        <ProductNotFound />
      )}
    </article>
  )
}

function ProductDetail({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const product = useProduct(id)
  const [retrying, setRetrying] = useState(false)
  const [focusTitleWhenLoaded, setFocusTitleWhenLoaded] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const loaded = product.isSuccess && !product.isPlaceholderData

  useEffect(() => {
    if (!focusTitleWhenLoaded || !loaded) return
    setFocusTitleWhenLoaded(false)
    headingRef.current?.focus()
  }, [focusTitleWhenLoaded, loaded])

  if (product.isSuccess && !(product.isPlaceholderData && retrying)) {
    return <ProductInfo product={product.data} headingRef={headingRef} />
  }
  if (product.isPending && !retrying) return <StatusMessage>Carregando produto…</StatusMessage>
  if (product.isError && isNotFound(product.error)) return <ProductNotFound />

  const retry = (
    <button
      type="button"
      className={buttonClass}
      aria-disabled={retrying || undefined}
      onClick={() => {
        if (retrying) return
        setRetrying(true)
        setFocusTitleWhenLoaded(true)
        void product.refetch().then((result) => {
          setRetrying(false)
          if (result.isError) setFocusTitleWhenLoaded(false)
        })
      }}
    >
      Tentar novamente
    </button>
  )
  const shown = product.data ?? findProductInLists(queryClient, id)
  if (!shown) {
    return (
      <StatusMessage tone="error" action={retry}>
        {retrying ? 'Tentando novamente…' : 'Não foi possível carregar o produto.'}
      </StatusMessage>
    )
  }
  return (
    <>
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <p>
          {retrying
            ? 'Tentando novamente…'
            : 'Não foi possível confirmar os dados mais recentes deste produto.'}
        </p>
        {retry}
      </div>
      <ProductInfo product={shown} />
    </>
  )
}

function ProductInfo({
  product,
  headingRef,
}: {
  product: Product
  headingRef?: Ref<HTMLHeadingElement>
}) {
  const { title, brand, description, priceCents, rating, stock, imageUrls, thumbnailUrl } = product
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <img
        src={imageUrls[0] ?? thumbnailUrl}
        alt={title}
        className="aspect-square w-full rounded-lg border border-slate-200 bg-white object-contain"
      />
      <div className="flex flex-col gap-3">
        {brand && <p className="text-sm text-slate-500">{brand}</p>}
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold focus:outline-none">
          {title}
        </h1>
        <p className="text-2xl font-semibold">{formatPrice(priceCents)}</p>
        <p className="text-sm text-slate-600">Nota {ratingFormatter.format(rating)} de 5</p>
        <p className={stock > 0 ? 'text-sm text-green-700' : 'text-sm font-medium text-red-700'}>
          {stock > 0 ? `Em estoque: ${stock}` : 'Esgotado'}
        </p>
        <AddToCartButton product={product} />
        <p className="text-slate-700">{description}</p>
      </div>
    </div>
  )
}

function BackLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const cameFromApp = location.key !== 'default'

  return (
    <Link
      to="/"
      onClick={(event) => {
        if (!cameFromApp || isModifiedClick(event)) return
        event.preventDefault()
        navigate(-1)
      }}
      className="self-start text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <span aria-hidden="true">← </span>Voltar
    </Link>
  )
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function ProductNotFound() {
  return (
    <StatusMessage
      action={
        <Link to="/" className={buttonClass}>
          Ver produtos
        </Link>
      }
    >
      Produto não encontrado.
    </StatusMessage>
  )
}
