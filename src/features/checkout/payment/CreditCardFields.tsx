import { formatPrice } from '@/shared/lib/formatPrice'
import { FormField, SelectField } from '../components/FormField'
import { formatCardNumber, formatExpiry, onlyDigits } from '../model/masks'
import { getInstallmentOptions } from './installments'

export function CreditCardFields({ totalCents }: { totalCents: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        name="payment.cardNumber"
        label="Número do cartão"
        mask={formatCardNumber}
        inputMode="numeric"
        autoComplete="cc-number"
        className="sm:col-span-2"
      />
      <FormField
        name="payment.cardName"
        label="Nome impresso no cartão"
        autoComplete="cc-name"
        className="sm:col-span-2"
      />
      <FormField
        name="payment.expiry"
        label="Validade (MM/AA)"
        mask={formatExpiry}
        inputMode="numeric"
        autoComplete="cc-exp"
      />
      <FormField
        name="payment.cvv"
        label="CVV"
        mask={(value) => onlyDigits(value).slice(0, 4)}
        inputMode="numeric"
        autoComplete="cc-csc"
      />
      <SelectField
        name="payment.installments"
        label="Parcelamento"
        valueAsNumber
        className="sm:col-span-2"
      >
        {getInstallmentOptions(totalCents).map(({ count, amountCents }) => (
          <option key={count} value={count}>
            {count}x de {formatPrice(amountCents)} sem juros
          </option>
        ))}
      </SelectField>
    </div>
  )
}
