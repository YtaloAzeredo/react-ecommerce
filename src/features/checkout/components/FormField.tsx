import { useId, type ComponentProps, type ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { onlyDigits } from '../model/masks'

type CheckoutFieldPath = FieldPath<CheckoutFormValues>

const controlClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 aria-invalid:border-red-600'

function useFieldState(name: CheckoutFieldPath, hint?: string) {
  const { register, getFieldState, formState } = useFormContext<CheckoutFormValues>()
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const message = getFieldState(name, formState).error?.message
  const describedBy = [message && errorId, hint && hintId].filter(Boolean).join(' ')
  return {
    register,
    shell: { id, errorId, hintId, message, hint },
    controlProps: {
      id,
      'aria-invalid': message ? true : undefined,
      'aria-describedby': describedBy || undefined,
    },
  }
}

function FieldShell({
  id,
  errorId,
  hintId,
  message,
  hint,
  label,
  className = '',
  children,
}: {
  id: string
  errorId: string
  hintId: string
  message?: string
  hint?: string
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {message && (
        <p id={errorId} className="text-sm text-red-700">
          {message}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-slate-600">
          {hint}
        </p>
      )}
    </div>
  )
}

function applyMask(input: HTMLInputElement, mask: (value: string) => string) {
  const caret = input.selectionStart ?? input.value.length
  const digitsBeforeCaret = onlyDigits(input.value.slice(0, caret)).length
  const masked = mask(input.value)
  input.value = masked
  if (document.activeElement !== input) return
  let position = 0
  for (let seen = 0; position < masked.length && seen < digitsBeforeCaret; position++) {
    if (/\d/.test(masked[position])) seen++
  }
  input.setSelectionRange(position, position)
}

type FormFieldProps = Omit<ComponentProps<'input'>, 'name' | 'id' | 'onChange'> & {
  name: CheckoutFieldPath
  label: string
  mask?: (value: string) => string
}

export function FormField({ name, label, mask, className, ...inputProps }: FormFieldProps) {
  const { register, shell, controlProps } = useFieldState(name)
  const { onChange, ...field } = register(name)

  return (
    <FieldShell {...shell} label={label} className={className}>
      <input
        {...inputProps}
        {...field}
        {...controlProps}
        onChange={(event) => {
          if (mask) applyMask(event.target, mask)
          return onChange(event)
        }}
        className={controlClass}
      />
    </FieldShell>
  )
}

export function SelectField({
  name,
  label,
  hint,
  valueAsNumber = false,
  className,
  children,
}: {
  name: CheckoutFieldPath
  label: string
  hint?: string
  valueAsNumber?: boolean
  className?: string
  children: ReactNode
}) {
  const { register, shell, controlProps } = useFieldState(name, hint)

  return (
    <FieldShell {...shell} label={label} className={className}>
      <select {...register(name, { valueAsNumber })} {...controlProps} className={controlClass}>
        {children}
      </select>
    </FieldShell>
  )
}
