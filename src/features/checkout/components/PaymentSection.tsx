import { useFormContext, useWatch } from 'react-hook-form'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { getPaymentStrategy, paymentStrategies } from '../payment/paymentStrategies'

export function PaymentSection({ subtotalCents }: { subtotalCents: number }) {
  const { control, setValue, clearErrors } = useFormContext<CheckoutFormValues>()
  const method = useWatch({ control, name: 'payment.method' })
  const strategy = getPaymentStrategy(method)
  const { Fields } = strategy

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
                onChange={() => {
                  // Trocar de forma de pagamento descarta o que foi digitado na anterior (inclusive
                  // o cartão) e os erros dela.
                  setValue('payment', option.defaultValues)
                  clearErrors('payment')
                }}
              />
              {option.label}
            </label>
            <p id={`payment-${option.method}-description`} className="text-sm text-slate-600">
              {option.description}
            </p>
          </div>
        ))}
      </div>
      {Fields && <Fields totalCents={strategy.computeTotalCents(subtotalCents)} />}
    </fieldset>
  )
}
