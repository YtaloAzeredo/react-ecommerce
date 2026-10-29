import { createContext, use, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getPageItems } from '@/shared/lib/getPageItems'

// Compound component: a raiz guarda o estado e cada parte (Previous, Items, Next) lê do contexto,
// então quem usa escolhe quais partes aparecem e em que ordem, sem uma lista de props booleanas.

interface PaginationContextValue {
  page: number
  totalPages: number
  getHref: (page: number) => string
}

const PaginationContext = createContext<PaginationContextValue | null>(null)

function usePaginationContext(): PaginationContextValue {
  const context = use(PaginationContext)
  if (!context) throw new Error('Pagination.* precisa estar dentro de <Pagination>')
  return context
}

export function Pagination({
  page,
  totalPages,
  getHref,
  children,
}: PaginationContextValue & { children: ReactNode }) {
  if (totalPages <= 1) return null
  return (
    <PaginationContext value={{ page, totalPages, getHref }}>
      <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
        {children}
      </nav>
    </PaginationContext>
  )
}

const stepClass = 'rounded-md border px-3 py-2 text-sm font-medium'

function Step({ label, href }: { label: string; href: string | null }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={`${stepClass} border-slate-200 text-slate-400`}>
        {label}
      </span>
    )
  }
  return (
    <Link to={href} className={`${stepClass} border-slate-300 bg-white hover:bg-slate-100`}>
      {label}
    </Link>
  )
}

function PaginationPrevious() {
  const { page, getHref } = usePaginationContext()
  return <Step label="Anterior" href={page > 1 ? getHref(page - 1) : null} />
}

function PaginationNext() {
  const { page, totalPages, getHref } = usePaginationContext()
  return <Step label="Próxima" href={page < totalPages ? getHref(page + 1) : null} />
}

function PaginationItems() {
  const { page, totalPages, getHref } = usePaginationContext()
  return (
    <ol className="flex items-center gap-1">
      {getPageItems(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <li key={`ellipsis-${index}`} aria-hidden="true" className="px-2 text-slate-400">
            …
          </li>
        ) : (
          <li key={item}>
            <Link
              to={getHref(item)}
              aria-label={`Página ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className="block min-w-10 rounded-md px-3 py-2 text-center text-sm font-medium hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white"
            >
              {item}
            </Link>
          </li>
        ),
      )}
    </ol>
  )
}

Pagination.Previous = PaginationPrevious
Pagination.Items = PaginationItems
Pagination.Next = PaginationNext
