import { useState } from 'react'
import { Link } from 'react-router'
import { isModifiedClick } from '@/shared/lib/isModifiedClick'

const buttonClass = 'rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700'

export function SearchForm({
  value,
  onSearch,
  onEdit,
}: {
  value: string | null
  onSearch: (term: string | null) => void
  onEdit: () => void
}) {
  const [draft, setDraft] = useState(value ?? '')
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value ?? '')
  }

  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const term = draft.trim() || null
        if (term !== value) onSearch(term)
      }}
    >
      <label className="flex min-w-40 flex-1 items-center gap-2 text-sm">
        <span className="font-medium">Buscar</span>
        <input
          type="search"
          name="q"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            onEdit()
          }}
          autoComplete="off"
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3"
        />
      </label>
      <button type="submit" className={buttonClass}>
        Buscar
      </button>
      {value && (
        <Link
          to="/"
          onClick={(event) => {
            if (isModifiedClick(event)) return
            event.preventDefault()
            onSearch(null)
          }}
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          Limpar busca
        </Link>
      )}
    </form>
  )
}
