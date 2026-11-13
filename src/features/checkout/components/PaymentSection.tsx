import { useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { getPaymentStrategy, paymentStrategies } from '../payment/paymentStrategies'

type PaymentValues = CheckoutFormValues['payment']
type CardValues = Extract<PaymentValues, { method: 'credit_card' }>

export function PaymentSection({ totalCents }: { totalCents: number }) {
  const { control, getValues, setValue, clearErrors, trigger, formState } =
    useFormContext<CheckoutFormValues>()
  const method = useWatch({ control, name: 'payment.method' })
  const strategy = getPaymentStrategy(method)
  const { Fields } = strategy
  const rememberedCard = useRef<CardValues | null>(null)

  function switchTo(next: PaymentValues) {
    const current = getValues('payment')
    if (current.method === 'credit_card') rememberedCard.current = current
    const restored = next.method === 'credit_card' ? rememberedCard.current : null
    setValue('payment', restored ?? next)
    clearErrors('payment')
    if (restored && formState.isSubmitted) void trigger('payment')
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-lg font-semibold">Pagamento</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {paymentStrategies.map((option) => (
          <div
            key={option.method}
            className="flex flex-col gap-1 rounded-md border border-slate-300 bg-white p-3 has-checked:border-slate-900 has-checked:ring-1 has-checked:ring-slate-900"
          >
            <label className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-method"
                value={option.method}
                checked={option.method === method}
                aria-describedby={`payment-${option.method}-description`}
                onChange={() => switchTo(option.defaultValues)}
              />
              {option.label}
            </label>
            <p id={`payment-${option.method}-description`} className="text-sm text-slate-600">
              {option.description}
            </p>
          </div>
        ))}
      </div>
      {Fields && <Fields totalCents={totalCents} />}
    </fieldset>
  )
}
