import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'

const navigationKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])

function isKeyboardNavigation(event: KeyboardEvent<HTMLSelectElement>): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  return navigationKeys.has(event.key) || (event.key.length === 1 && event.key !== ' ')
}

type Draft = { base: string | null; next: string | null }

export type FilterOption = { value: string; label: string }

export function FilterSelect({
  label,
  emptyLabel,
  options,
  value,
  onChange,
  ref,
}: {
  label: string
  emptyLabel: string
  options: FilterOption[]
  value: string | null
  onChange: (next: string | null) => void
  ref?: Ref<HTMLSelectElement>
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const changedByKeyboard = useRef(false)
  const keyboardTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pending = draft && draft.base === value ? draft : null
  const shown = pending ? pending.next : value

  useEffect(() => () => clearTimeout(keyboardTimer.current), [])

  function commit() {
    setDraft(null)
    if (pending && pending.next !== value) onChange(pending.next)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select
        ref={ref}
        value={shown ?? ''}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          else if (event.key === 'Escape') setDraft(null)
          else if (isKeyboardNavigation(event)) {
            changedByKeyboard.current = true
            clearTimeout(keyboardTimer.current)
            keyboardTimer.current = setTimeout(() => {
              changedByKeyboard.current = false
            }, 0)
          }
        }}
        onChange={(event) => {
          const next = event.target.value || null
          if (changedByKeyboard.current) setDraft({ base: value, next })
          else onChange(next)
        }}
        onBlur={commit}
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">{emptyLabel}</option>
        {shown && !options.some((option) => option.value === shown) && (
          <option value={shown}>{shown}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
