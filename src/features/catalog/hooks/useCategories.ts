import { useQuery } from '@tanstack/react-query'
import { categoriesQuery } from '../queries'

export function useCategories() {
  return useQuery(categoriesQuery())
}
