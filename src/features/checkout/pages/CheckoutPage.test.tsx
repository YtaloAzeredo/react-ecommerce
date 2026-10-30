import { screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCart } from '@/features/cart/model/cartStorage'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { PaymentDeclinedError, submitOrder } from '../api/orderService'
import { loadCheckoutDraft } from '../model/checkoutDraft'

// O envio é trocado por um mock para cada teste decidir a resposta; o erro de recusa continua o real,
// porque a página o reconhece pela classe.
vi.mock('../api/orderService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/orderService')>()
  return { ...actual, submitOrder: vi.fn() }
})

const cartItem = makeCartItem({ productId: 1, priceCents: 10000, quantity: 1 })

// Os campos de apoio são colados, não digitados: um evento por campo em vez de um por tecla mantém
// os testes rápidos. A máscara se aplica do mesmo jeito; quem testa digitação é o teste do CPF.
async function fill(user: UserEvent, label: string, value: string) {
  await user.click(screen.getByLabelText(label))
  await user.paste(value)
}

async function fillCustomerAndAddress(user: UserEvent) {
  await fill(user, 'Nome completo', 'Ana Souza')
  await fill(user, 'E-mail', 'ana@example.com')
  await fill(user, 'CPF', '52998224725')
  await fill(user, 'Telefone', '11987654321')
  await fill(user, 'CEP', '01310100')
  await fill(user, 'Rua', 'Avenida Paulista')
  await fill(user, 'Número', '1000')
  await fill(user, 'Bairro', 'Bela Vista')
  await fill(user, 'Cidade', 'São Paulo')
  await user.selectOptions(screen.getByLabelText('Estado'), 'SP')
}

async function fillCard(user: UserEvent, cardNumber: string) {
  await fill(user, 'Número do cartão', cardNumber)
  await fill(user, 'Nome impresso no cartão', 'ANA SOUZA')
  await fill(user, 'Validade (MM/AA)', '1299')
  await fill(user, 'CVV', '123')
}

// A rota do checkout é carregada sob demanda: espera a página chegar antes de interagir.
async function openCheckout() {
  const rendered = renderRoute('/checkout')
  await screen.findByRole('heading', { level: 1, name: 'Finalizar compra' })
  return rendered
}

function summary() {
  return within(screen.getByRole('region', { name: 'Resumo do pedido' }))
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.mocked(submitOrder).mockReset()
    seedCart([cartItem])
  })

  it('abrir o checkout direto mostra "Carregando…" enquanto o código da página chega', async () => {
    renderRoute('/checkout')

    expect(screen.getByText('Carregando…')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vitrine' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Finalizar compra' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Carregando…')).not.toBeInTheDocument()
  })

  it('carrinho vazio redireciona para /cart', async () => {
    localStorage.clear()

    const { router } = renderRoute('/checkout')

    expect(await screen.findByText('Seu carrinho está vazio.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/cart')
  })

  it('enviar vazio mostra erros por campo e foca o primeiro', async () => {
    const { user } = await openCheckout()

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByText('Informe nome e sobrenome')).toBeInTheDocument()
    expect(screen.getByText('Selecione o estado')).toBeInTheDocument()
    expect(screen.getByText('Número de cartão inválido')).toBeInTheDocument()
    const fullName = screen.getByLabelText('Nome completo')
    expect(fullName).toHaveFocus()
    expect(fullName).toHaveAttribute('aria-invalid', 'true')
    expect(fullName).toHaveAccessibleDescription('Informe nome e sobrenome')
    expect(submitOrder).not.toHaveBeenCalled()
  })

  it('CPF recebe máscara', async () => {
    const { user } = await openCheckout()

    await user.type(screen.getByLabelText('CPF'), '52998224725')

    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
  })

  it('telefone pede ao autopreenchimento o número sem o código do país', async () => {
    // Com "tel", o navegador preenche "+55 11 …" e a máscara transformaria o 55 em DDD.
    await openCheckout()

    expect(screen.getByLabelText('Telefone')).toHaveAttribute('autocomplete', 'tel-national')
  })

  it('campos de cartão só aparecem com cartão', async () => {
    const { user } = await openCheckout()
    expect(screen.getByLabelText('Número do cartão')).toBeInTheDocument()
    expect(summary().getByText('Total').nextElementSibling).toHaveTextContent('US$ 100,00')

    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    expect(screen.queryByLabelText('Número do cartão')).not.toBeInTheDocument()
    expect(summary().getByText('Desconto').nextElementSibling).toHaveTextContent('-US$ 5,00')
    expect(summary().getByText('Total').nextElementSibling).toHaveTextContent('US$ 95,00')
  })

  it('pedido aprovado limpa o carrinho e vai para a confirmação', async () => {
    const confirmation = { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'pix' as const }
    vi.mocked(submitOrder).mockResolvedValue(confirmation)
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pedido confirmado!' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/checkout/success')
    expect(router.state.location.state).toEqual(confirmation)
    expect(screen.getByRole('link', { name: 'Carrinho (0 itens)' })).toBeInTheDocument()
    expect(submitOrder).toHaveBeenCalledTimes(1)
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 9500,
        items: [cartItem],
        payment: { method: 'pix' },
        customer: expect.objectContaining({ cpf: '529.982.247-25' }),
      }),
    )
    expect(loadCart().items).toEqual([])
    expect(loadCheckoutDraft()).toBeNull()
  })

  it('cartão aprovado envia os dados do cartão e o parcelamento', async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      orderId: 'AB12CD34',
      totalCents: 10000,
      paymentMethod: 'credit_card',
    })
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4242424242424242')
    await user.selectOptions(screen.getByLabelText('Parcelamento'), '3')

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout/success'))
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 10000,
        payment: expect.objectContaining({
          method: 'credit_card',
          cardNumber: '4242 4242 4242 4242',
          installments: 3,
        }),
      }),
    )
  })

  it('clique duplo envia um pedido só', async () => {
    vi.mocked(submitOrder).mockReturnValue(new Promise(() => {}))
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.dblClick(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('button', { name: 'Enviando…' })).toBeDisabled()
    expect(submitOrder).toHaveBeenCalledTimes(1)
  })

  it('cartão recusado mostra o erro e mantém o formulário', async () => {
    vi.mocked(submitOrder).mockRejectedValue(new PaymentDeclinedError())
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4000000000000002')

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pagamento recusado pela operadora do cartão. Tente outro cartão ou outra forma de pagamento.',
    )
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza')
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeEnabled()
    expect(router.state.location.pathname).toBe('/checkout')
    expect(loadCart().items).toEqual([cartItem])
  })

  it('outro erro no envio mostra a mensagem genérica', async () => {
    vi.mocked(submitOrder).mockRejectedValue(new Error('falha de rede'))
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível finalizar o pedido. Tente novamente.',
    )
  })

  it('rascunho volta ao reabrir o checkout, sem os dados do cartão', async () => {
    const first = await openCheckout()
    await first.user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
    await first.user.type(screen.getByLabelText('Número do cartão'), '4242424242424242')
    first.unmount()

    await openCheckout()

    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza')
    expect(screen.getByLabelText('Número do cartão')).toHaveValue('')
  })
})
