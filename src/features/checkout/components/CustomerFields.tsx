import { formatCpf, formatPhone } from '../model/masks'
import { FormField } from './FormField'

export function CustomerFields() {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-2 text-lg font-semibold">Seus dados</legend>
      <FormField
        name="customer.fullName"
        label="Nome completo"
        autoComplete="name"
        className="sm:col-span-2"
      />
      <FormField
        name="customer.email"
        label="E-mail"
        type="email"
        autoComplete="email"
        className="sm:col-span-2"
      />
      <FormField name="customer.cpf" label="CPF" mask={formatCpf} inputMode="numeric" />
      <FormField
        name="customer.phone"
        label="Telefone"
        mask={formatPhone}
        type="tel"
        autoComplete="tel-national"
      />
    </fieldset>
  )
}
