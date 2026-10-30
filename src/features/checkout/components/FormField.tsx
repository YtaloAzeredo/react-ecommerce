import { useId, type ComponentProps, type ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { onlyDigits } from '../model/masks'

type CheckoutFieldPath = FieldPath<CheckoutFormValues>

const controlClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 aria-invalid:border-red-600'

// O erro fica ligado ao campo por aria-describedby: quem chega ao campo com leitor de tela ouve o
// rótulo e o problema juntos.
function useFieldState(name: CheckoutFieldPath) {
  const { register, getFieldState, formState } = useFormContext<CheckoutFormValues>()
  const id = useId()
  const errorId = `${id}-error`
  const message = getFieldState(name, formState).error?.message
  return {
    register,
    shell: { id, errorId, message },
    controlProps: {
      id,
      'aria-invalid': message ? true : undefined,
      'aria-describedby': message ? errorId : undefined,
    },
  }
}

function FieldShell({
  id,
  errorId,
  message,
  label,
  className = '',
  children,
}: {
  id: string
  errorId: string
  message?: string
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
    </div>
  )
}

// Trocar o valor do campo manda o cursor para o fim; quem corrigisse um dígito no meio digitaria o
// próximo no fim e gravaria outro número. As máscaras daqui só têm dígitos e separadores, então o
// cursor volta para depois do mesmo número de dígitos que havia antes dele.
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
          // A máscara entra antes de o React Hook Form ler o valor: o formulário guarda o texto formatado.
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
  valueAsNumber = false,
  className,
  children,
}: {
  name: CheckoutFieldPath
  label: string
  valueAsNumber?: boolean
  className?: string
  children: ReactNode
}) {
  const { register, shell, controlProps } = useFieldState(name)

  return (
    <FieldShell {...shell} label={label} className={className}>
      <select {...register(name, { valueAsNumber })} {...controlProps} className={controlClass}>
        {children}
      </select>
    </FieldShell>
  )
}
