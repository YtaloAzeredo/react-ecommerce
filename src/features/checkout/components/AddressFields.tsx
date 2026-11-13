import { formatPrice } from '@/shared/lib/formatPrice'
import { BRAZILIAN_STATES } from '../model/checkoutSchema'
import { formatCep } from '../model/masks'
import type { ShippingQuote } from '../model/shipping'
import { FormField, SelectField } from './FormField'

function describeShipping(quote: ShippingQuote | null): string {
  if (!quote) return ''
  const delivery = `até ${quote.deliveryDays} dias úteis.`
  return quote.costCents === 0
    ? `Frete grátis para este CEP, ${delivery}`
    : `Frete para este CEP: ${formatPrice(quote.costCents)}, ${delivery}`
}

export function AddressFields({ shipping }: { shipping: ShippingQuote | null }) {
  const shippingHint = describeShipping(shipping)

  return (
    <fieldset className="grid gap-4 sm:grid-cols-6">
      <legend className="mb-2 text-lg font-semibold">Endereço</legend>
      <FormField
        name="address.cep"
        label="CEP"
        hint={shippingHint}
        mask={formatCep}
        inputMode="numeric"
        autoComplete="postal-code"
        className="sm:col-span-2"
      />
      <FormField
        name="address.street"
        label="Rua"
        autoComplete="address-line1"
        className="sm:col-span-4"
      />
      <FormField name="address.number" label="Número" className="sm:col-span-2" />
      <FormField
        name="address.complement"
        label="Complemento (opcional)"
        autoComplete="address-line2"
        className="sm:col-span-4"
      />
      <FormField name="address.neighborhood" label="Bairro" className="sm:col-span-2" />
      <FormField
        name="address.city"
        label="Cidade"
        autoComplete="address-level2"
        className="sm:col-span-2"
      />
      <SelectField name="address.state" label="Estado" className="sm:col-span-2">
        <option value="">Selecione</option>
        {BRAZILIAN_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </SelectField>
    </fieldset>
  )
}
