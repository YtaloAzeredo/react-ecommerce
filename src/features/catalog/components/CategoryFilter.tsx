import type { Ref } from 'react'
import type { Category } from '../model/types'

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
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">Categoria</span>
      <select
        ref={ref}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">Todas</option>
        {value && !categories.some((category) => category.slug === value) && (
          <option value={value}>{value}</option>
        )}
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  )
}
