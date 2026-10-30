import { describe, expect, it } from 'vitest'
import { checkoutSchema } from './checkoutSchema'

const validPixOrder = {
  customer: {
    fullName: 'Ana Souza',
    email: 'ana@example.com',
    cpf: '529.982.247-25',
    phone: '(11) 98765-4321',
  },
  address: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  payment: { method: 'pix' },
}

const validCard = {
  method: 'credit_card',
  cardNumber: '4242 4242 4242 4242',
  cardName: 'ANA SOUZA',
  expiry: '12/99',
  cvv: '123',
  installments: 3,
}

function issuesOf(values: unknown) {
  const result = checkoutSchema.safeParse(values)
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

describe('checkoutSchema', () => {
  it('aceita um pedido válido com Pix', () => {
    expect(issuesOf(validPixOrder)).toEqual([])
  })

  it('aceita um pedido válido com cartão', () => {
    expect(issuesOf({ ...validPixOrder, payment: validCard })).toEqual([])
  })

  it('cartão sem CVV falha em payment.cvv', () => {
    expect(issuesOf({ ...validPixOrder, payment: { ...validCard, cvv: '' } })).toEqual([
      { path: 'payment.cvv', message: 'CVV inválido' },
    ])
  })

  it('cartão com dados inválidos aponta cada campo', () => {
    const issues = issuesOf({
      ...validPixOrder,
      payment: {
        method: 'credit_card',
        cardNumber: '4242 4242 4242 4241',
        cardName: 'AN',
        expiry: '13/30',
        cvv: '12',
        installments: Number.NaN,
      },
    })

    expect(issues).toEqual([
      { path: 'payment.cardNumber', message: 'Número de cartão inválido' },
      { path: 'payment.cardName', message: 'Informe o nome impresso no cartão' },
      { path: 'payment.expiry', message: 'Validade inválida' },
      { path: 'payment.cvv', message: 'CVV inválido' },
      { path: 'payment.installments', message: 'Escolha o parcelamento' },
    ])
  })

  it('parcelamento fora de 1 a 12 falha', () => {
    expect(issuesOf({ ...validPixOrder, payment: { ...validCard, installments: 13 } })).toEqual([
      { path: 'payment.installments', message: 'Escolha o parcelamento' },
    ])
  })

  it('CPF inválido falha em customer.cpf', () => {
    expect(
      issuesOf({
        ...validPixOrder,
        customer: { ...validPixOrder.customer, cpf: '529.982.247-24' },
      }),
    ).toEqual([{ path: 'customer.cpf', message: 'CPF inválido' }])
  })

  it('nome sem sobrenome falha', () => {
    for (const fullName of ['Ana', '  Ana  ']) {
      expect(
        issuesOf({ ...validPixOrder, customer: { ...validPixOrder.customer, fullName } }),
      ).toEqual([{ path: 'customer.fullName', message: 'Informe nome e sobrenome' }])
    }
  })

  it('e-mail e telefone inválidos falham', () => {
    expect(
      issuesOf({
        ...validPixOrder,
        customer: { ...validPixOrder.customer, email: 'ana@', phone: '(11) 9876-543' },
      }),
    ).toEqual([
      { path: 'customer.email', message: 'E-mail inválido' },
      { path: 'customer.phone', message: 'Telefone inválido' },
    ])
  })

  it('endereço vazio pede cada campo obrigatório', () => {
    expect(
      issuesOf({
        ...validPixOrder,
        address: {
          cep: '01310',
          street: ' ',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
      }),
    ).toEqual([
      { path: 'address.cep', message: 'CEP inválido' },
      { path: 'address.street', message: 'Informe a rua' },
      { path: 'address.number', message: 'Informe o número' },
      { path: 'address.neighborhood', message: 'Informe o bairro' },
      { path: 'address.city', message: 'Informe a cidade' },
      { path: 'address.state', message: 'Selecione o estado' },
    ])
  })

  it('estado fora da lista falha', () => {
    expect(
      issuesOf({ ...validPixOrder, address: { ...validPixOrder.address, state: 'XX' } }),
    ).toEqual([{ path: 'address.state', message: 'Selecione o estado' }])
  })

  it('remove espaços nas pontas do que foi digitado', () => {
    const result = checkoutSchema.parse({
      ...validPixOrder,
      customer: { ...validPixOrder.customer, fullName: '  Ana Souza ' },
    })

    expect(result.customer.fullName).toBe('Ana Souza')
  })
})
