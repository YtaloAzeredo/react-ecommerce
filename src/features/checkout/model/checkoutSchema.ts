import { z } from 'zod'
import { onlyDigits } from './masks'
import { isValidCardNumber, isValidCpf, isValidExpiry } from './validators'

export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

function requiredText(message: string) {
  return z.string().trim().min(1, message)
}

// Os campos com máscara guardam o texto formatado; as regras olham só os dígitos.
function digitCount(min: number, max: number, message: string) {
  return z.string().refine((value) => {
    const length = onlyDigits(value).length
    return length >= min && length <= max
  }, message)
}

const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .refine((value) => value.length >= 3 && value.includes(' '), 'Informe nome e sobrenome'),
  email: z.email('E-mail inválido'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido'),
  phone: digitCount(10, 11, 'Telefone inválido'),
})

const addressSchema = z.object({
  cep: digitCount(8, 8, 'CEP inválido'),
  street: requiredText('Informe a rua'),
  number: requiredText('Informe o número'),
  complement: z.string().trim().optional(),
  neighborhood: requiredText('Informe o bairro'),
  city: requiredText('Informe a cidade'),
  state: z.enum(BRAZILIAN_STATES, 'Selecione o estado'),
})

const installmentsMessage = 'Escolha o parcelamento'

// Cada forma de pagamento tem os próprios campos: com a união discriminada por `method`, os campos
// do cartão só são exigidos quando o cartão está escolhido.
const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit_card'),
    cardNumber: z.string().refine(isValidCardNumber, 'Número de cartão inválido'),
    cardName: z.string().trim().min(3, 'Informe o nome impresso no cartão'),
    expiry: z.string().refine((value) => isValidExpiry(value), 'Validade inválida'),
    cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
    installments: z
      .number(installmentsMessage)
      .int(installmentsMessage)
      .min(1, installmentsMessage)
      .max(12, installmentsMessage),
  }),
  z.object({ method: z.literal('pix') }),
  z.object({ method: z.literal('boleto') }),
])

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  payment: paymentSchema,
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
export type PaymentMethod = CheckoutFormValues['payment']['method']
