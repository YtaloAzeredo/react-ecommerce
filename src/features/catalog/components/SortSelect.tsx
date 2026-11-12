import type { ProductSort } from '../model/types'
import { FilterSelect, type FilterOption } from './FilterSelect'

const sortOptions: (FilterOption & { value: ProductSort })[] = [
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'title-asc', label: 'Nome (A–Z)' },
]

export function SortSelect({
  value,
  onChange,
}: {
  value: ProductSort | null
  onChange: (sort: ProductSort | null) => void
}) {
  return (
    <FilterSelect
      label="Ordenar por"
      emptyLabel="Padrão"
      options={sortOptions}
      value={value}
      onChange={(next) =>
        onChange(sortOptions.find((option) => option.value === next)?.value ?? null)
      }
    />
  )
}
