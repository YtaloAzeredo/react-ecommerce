import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { HttpError } from '@/shared/api/http'
import { formatPrice } from '@/shared/lib/formatPrice'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { useProduct } from '../hooks/useProduct'
import type { Product } from '../model/types'
import { findProductInLists } from '../queries'

const buttonClass = 'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700'

const ratingFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function ProductDetailPage() {
  const { productId = '' } = useParams()
  return (
    <article className="flex flex-col gap-6">
      {/* Fora dos estados: a pessoa sempre tem como voltar, mesmo no erro ou no "não encontrado". */}
      <BackLink />
      {/* /products/abc nem chega a consultar a API. */}
      {/^\d+$/.test(productId) ? <ProductDetail id={Number(productId)} /> : <ProductNotFound />}
    </article>
  )
}

function ProductDetail({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const product = useProduct(id)

  if (product.isPending) return <StatusMessage>Carregando produto…</StatusMessage>
  if (product.isError) {
    if (product.error instanceof HttpError && product.error.status === 404) {
      return <ProductNotFound />
    }
    const retry = (
      <button type="button" className={buttonClass} onClick={() => product.refetch()}>
        Tentar novamente
      </button>
    )
    // Num erro, o TanStack Query descarta o dado provisório; o que já estava na tela continua
    // valendo (veio da lista ou de uma busca anterior), então o produto fica com um aviso.
    const shown = product.data ?? findProductInLists(queryClient, id)
    if (!shown) {
      return (
        <StatusMessage tone="error" action={retry}>
          Não foi possível carregar o produto.
        </StatusMessage>
      )
    }
    return (
      <>
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p>Não foi possível confirmar os dados mais recentes deste produto.</p>
          {retry}
        </div>
        <ProductInfo product={shown} />
      </>
    )
  }

  return <ProductInfo product={product.data} />
}

function ProductInfo({ product }: { product: Product }) {
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
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-2xl font-semibold">{formatPrice(priceCents)}</p>
        <p className="text-sm text-slate-600">Nota {ratingFormatter.format(rating)} de 5</p>
        <p className={stock > 0 ? 'text-sm text-green-700' : 'text-sm font-medium text-red-700'}>
          {stock > 0 ? `Em estoque: ${stock}` : 'Esgotado'}
        </p>
        <p className="text-slate-700">{description}</p>
      </div>
    </div>
  )
}

// Volta pelo histórico quando a pessoa veio de dentro do app, para cair na mesma página e posição
// do catálogo; quem abriu o link direto não tem para onde voltar e vai para a lista.
function BackLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const cameFromApp = location.key !== 'default'

  return (
    <Link
      to="/"
      onClick={(event) => {
        if (!cameFromApp) return
        event.preventDefault()
        navigate(-1)
      }}
      className="self-start text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <span aria-hidden="true">← </span>Voltar
    </Link>
  )
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
