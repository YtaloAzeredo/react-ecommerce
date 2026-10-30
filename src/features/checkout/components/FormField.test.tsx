import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { formatCardNumber, formatPhone } from '../model/masks'
import type { CheckoutFormValues } from '../model/checkoutSchema'
import { FormField } from './FormField'

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm<CheckoutFormValues>()
  return <FormProvider {...form}>{children}</FormProvider>
}

describe('FormField com máscara', () => {
  it('corrigir um dígito no meio mantém o cursor no lugar', async () => {
    const user = userEvent.setup()
    render(<FormField name="customer.phone" label="Telefone" mask={formatPhone} />, {
      wrapper: FormWrapper,
    })
    const input = screen.getByLabelText('Telefone')
    await user.type(input, '11987654321')

    // Cursor logo depois do "8" de (11) 98765-4321: apaga o 8 e digita 7 no lugar.
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

    // Faltam dois dígitos: insere "99" logo depois do primeiro grupo, antes do espaço.
    await user.type(input, '99', { initialSelectionStart: 4, initialSelectionEnd: 4 })

    expect(input).toHaveValue('4242 9942 4242 4242')
  })
})
