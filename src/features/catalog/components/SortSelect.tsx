import { parseSort } from '../hooks/useCatalogParams'
import { sortLabels } from '../model/sortLabels'
import { productSorts, type ProductSort } from '../model/types'
import { FilterSelect } from './FilterSelect'

const sortOptions = productSorts.map((sort) => ({ value: sort, label: sortLabels[sort].option }))

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
      onChange={(next) => onChange(parseSort(next))}
    />
  )
}
