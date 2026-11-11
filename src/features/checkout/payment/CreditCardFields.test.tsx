import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { CreditCardFields } from './CreditCardFields'
import { getPaymentStrategy } from './paymentStrategies'

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm<CheckoutFormValues>({
    defaultValues: { payment: getPaymentStrategy('credit_card').defaultValues },
  })
  return <FormProvider {...form}>{children}</FormProvider>
}

function renderFields(totalCents: number) {
  const user = userEvent.setup()
  render(<CreditCardFields totalCents={totalCents} />, { wrapper: FormWrapper })
  return user
}

describe('CreditCardFields', () => {
  it('mostra os campos do cartão', () => {
    renderFields(10000)

    expect(screen.getByLabelText('Número do cartão')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome impresso no cartão')).toBeInTheDocument()
    expect(screen.getByLabelText('Validade (MM/AA)')).toBeInTheDocument()
    expect(screen.getByLabelText('CVV')).toBeInTheDocument()
  })

  it('parcelamento é calculado a partir do total', () => {
    renderFields(10000)
    const select = screen.getByRole('combobox', { name: 'Parcelamento' })

    expect(within(select).getAllByRole('option')).toHaveLength(12)
    expect(
      within(select).getByRole('option', { name: '2x de US$\u00a050,00 sem juros' }),
    ).toBeTruthy()
    expect(
      within(select).getByRole('option', { name: '3x de US$\u00a033,33 sem juros' }),
    ).toBeTruthy()
  })

  it('avisa o valor da primeira parcela só quando ela é diferente das outras', async () => {
    const user = renderFields(10000)
    const select = screen.getByRole('combobox', { name: 'Parcelamento' })
    expect(select).not.toHaveAccessibleDescription()

    await user.selectOptions(select, '3')

    expect(screen.getByText('A primeira parcela é de US$ 33,34.')).toBeInTheDocument()
    expect(select).toHaveAccessibleDescription('A primeira parcela é de US$\u00a033,34.')

    await user.selectOptions(select, '2')

    expect(screen.queryByText(/A primeira parcela/)).not.toBeInTheDocument()
    expect(select).not.toHaveAccessibleDescription()
  })

  it('número do cartão, validade e CVV recebem máscara', async () => {
    const user = renderFields(10000)

    await user.type(screen.getByLabelText('Número do cartão'), '4242424242424242')
    await user.type(screen.getByLabelText('Validade (MM/AA)'), '1228')
    await user.type(screen.getByLabelText('CVV'), '12a345')

    expect(screen.getByLabelText('Número do cartão')).toHaveValue('4242 4242 4242 4242')
    expect(screen.getByLabelText('Validade (MM/AA)')).toHaveValue('12/28')
    expect(screen.getByLabelText('CVV')).toHaveValue('1234')
  })
})
