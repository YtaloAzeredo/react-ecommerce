import { createContext, use, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getPageItems } from '@/shared/lib/getPageItems'

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

function Step({ label, href, disabled }: { label: string; href: string; disabled: boolean }) {
  return (
    <Link
      to={href}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
      className={`${stepClass} ${disabled ? 'cursor-default border-slate-200 text-slate-400' : 'border-slate-300 bg-white hover:bg-slate-100'}`}
    >
      {label}
    </Link>
  )
}

function PaginationPrevious() {
  const { page, getHref } = usePaginationContext()
  return <Step label="Anterior" href={getHref(Math.max(1, page - 1))} disabled={page <= 1} />
}

function PaginationNext() {
  const { page, totalPages, getHref } = usePaginationContext()
  return (
    <Step
      label="Próxima"
      href={getHref(Math.min(totalPages, page + 1))}
      disabled={page >= totalPages}
    />
  )
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
