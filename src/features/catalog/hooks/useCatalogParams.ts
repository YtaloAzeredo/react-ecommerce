import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router'

export function parsePage(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) return 1
  return Math.max(1, Number(raw))
}

type CatalogTarget = { page?: number; category?: string | null; search?: string | null }

export function useCatalogParams() {
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('q')?.trim() || null
  const category = search ? null : searchParams.get('category') || null

  const hrefFor = useCallback(
    (next: CatalogTarget) => {
      const nextSearch = next.search !== undefined ? next.search : next.category ? null : search
      const nextCategory =
        next.category !== undefined ? next.category : next.search ? null : category
      const filterChanged = nextSearch !== search || nextCategory !== category
      const nextPage = next.page ?? (filterChanged ? 1 : page)
      const params = new URLSearchParams()
      if (nextSearch) params.set('q', nextSearch)
      if (nextCategory) params.set('category', nextCategory)
      if (nextPage > 1) params.set('page', String(nextPage))
      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [category, page, pathname, search],
  )

  return { page, category, search, hrefFor }
}
