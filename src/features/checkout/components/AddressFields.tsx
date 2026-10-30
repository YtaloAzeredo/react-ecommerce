import { BRAZILIAN_STATES } from '../model/checkoutSchema'
import { formatCep } from '../model/masks'
import { FormField, SelectField } from './FormField'

export function AddressFields() {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-6">
      <legend className="mb-2 text-lg font-semibold">Endereço</legend>
      <FormField
        name="address.cep"
        label="CEP"
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
