import type { Category } from '../model/types'

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string | null
  onChange: (category: string | null) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">Categoria</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">Todas</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  )
}
