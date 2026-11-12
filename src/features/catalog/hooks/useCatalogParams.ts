import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { productSorts, type ProductSort } from '../model/types'

export function parsePage(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) return 1
  return Math.max(1, Number(raw))
}

export function parseSort(raw: string | null): ProductSort | null {
  return productSorts.find((sort) => sort === raw) ?? null
}

type CatalogTarget = {
  page?: number
  category?: string | null
  search?: string | null
  sort?: ProductSort | null
}

export function useCatalogParams() {
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('q')?.trim() || null
  const category = search ? null : searchParams.get('category') || null
  const sort = parseSort(searchParams.get('sort'))

  const hrefFor = useCallback(
    (next: CatalogTarget) => {
      const nextSearch = next.search !== undefined ? next.search : next.category ? null : search
      const nextCategory =
        next.category !== undefined ? next.category : next.search ? null : category
      const nextSort = next.sort !== undefined ? next.sort : sort
      const filterChanged = nextSearch !== search || nextCategory !== category || nextSort !== sort
      const nextPage = next.page ?? (filterChanged ? 1 : page)
      const params = new URLSearchParams()
      if (nextSearch) params.set('q', nextSearch)
      if (nextCategory) params.set('category', nextCategory)
      if (nextSort) params.set('sort', nextSort)
      if (nextPage > 1) params.set('page', String(nextPage))
      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [category, page, pathname, search, sort],
  )

  return { page, category, search, sort, hrefFor }
}
