import type { Ref } from 'react'
import type { Category } from '../model/types'
import { FilterSelect } from './FilterSelect'

export function CategoryFilter({
  categories,
  value,
  onChange,
  ref,
}: {
  categories: Category[]
  value: string | null
  onChange: (category: string | null) => void
  ref?: Ref<HTMLSelectElement>
}) {
  return (
    <FilterSelect
      ref={ref}
      label="Categoria"
      emptyLabel="Todas"
      options={categories.map((category) => ({ value: category.slug, label: category.name }))}
      value={value}
      onChange={onChange}
    />
  )
}
