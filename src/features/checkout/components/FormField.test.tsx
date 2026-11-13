import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { formatCardNumber, formatPhone } from '../model/masks'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { FormField, SelectField } from './FormField'

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm<CheckoutFormValues>()
  return <FormProvider {...form}>{children}</FormProvider>
}

function FormWithStateError({ children }: { children: ReactNode }) {
  const form = useForm<CheckoutFormValues>()
  useEffect(() => {
    form.setError('address.state', { type: 'manual', message: 'Selecione o estado' })
  }, [form])
  return <FormProvider {...form}>{children}</FormProvider>
}

describe('FormField com dica', () => {
  it('descreve o campo pela dica numa região viva', () => {
    render(<FormField name="address.cep" label="CEP" hint="Frete: US$ 9,90." />, {
      wrapper: FormWrapper,
    })

    expect(screen.getByRole('status')).toHaveTextContent('Frete: US$ 9,90.')
    expect(screen.getByLabelText('CEP')).toHaveAccessibleDescription('Frete: US$ 9,90.')
  })
})

describe('SelectField com dica', () => {
  it('descreve o campo pelo erro e pela dica, nessa ordem', async () => {
    render(
      <SelectField name="address.state" label="Estado" hint="Use a sigla.">
        <option value="">Selecione</option>
        <option value="SP">SP</option>
      </SelectField>,
      { wrapper: FormWithStateError },
    )
    const select = screen.getByLabelText('Estado')

    await screen.findByText('Selecione o estado')

    expect(screen.getByText('Use a sigla.')).toBeInTheDocument()
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Selecione o estado Use a sigla.')
  })

  it('dica vazia mantém a região viva sem descrever o campo', () => {
    render(
      <SelectField name="address.state" label="Estado" hint="">
        <option value="SP">SP</option>
      </SelectField>,
      { wrapper: FormWrapper },
    )

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('Estado')).not.toHaveAccessibleDescription()
  })

  it('sem dica não há região viva', () => {
    render(
      <SelectField name="address.state" label="Estado">
        <option value="SP">SP</option>
      </SelectField>,
      { wrapper: FormWrapper },
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('FormField com máscara', () => {
  it('corrigir um dígito no meio mantém o cursor no lugar', async () => {
    const user = userEvent.setup()
    render(<FormField name="customer.phone" label="Telefone" mask={formatPhone} />, {
      wrapper: FormWrapper,
    })
    const input = screen.getByLabelText('Telefone')
    await user.type(input, '11987654321')

    await user.type(input, '{backspace}7', { initialSelectionStart: 7, initialSelectionEnd: 7 })

    expect(input).toHaveValue('(11) 97765-4321')
  })

  it('digitar no meio de um número de cartão insere no lugar', async () => {
    const user = userEvent.setup()
    render(
      <FormField name="payment.cardNumber" label="Número do cartão" mask={formatCardNumber} />,
      {
        wrapper: FormWrapper,
      },
    )
    const input = screen.getByLabelText('Número do cartão')
    await user.type(input, '42424242424242')

    await user.type(input, '99', { initialSelectionStart: 4, initialSelectionEnd: 4 })

    expect(input).toHaveValue('4242 9942 4242 4242')
  })
})
