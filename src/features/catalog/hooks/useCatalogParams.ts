import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router'

export function parsePage(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) return 1
  return Math.max(1, Number(raw))
}

export function useCatalogParams() {
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()
  const page = parsePage(searchParams.get('page'))
  const category = searchParams.get('category') || null

  const hrefFor = useCallback(
    (next: { page?: number; category?: string | null }) => {
      const nextCategory = next.category === undefined ? category : next.category
      const nextPage = next.page ?? (nextCategory === category ? page : 1)
      const params = new URLSearchParams()
      if (nextCategory) params.set('category', nextCategory)
      if (nextPage > 1) params.set('page', String(nextPage))
      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [category, page, pathname],
  )

  return { page, category, hrefFor }
}
