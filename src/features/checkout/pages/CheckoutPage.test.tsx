import { act, screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CART_STORAGE_KEY, loadCart } from '@/features/cart/model/cartStorage'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { PaymentDeclinedError, submitOrder } from '../api/orderService'
import { CHECKOUT_DRAFT_KEY, loadCheckoutDraft } from '../model/checkoutDraft'

vi.mock('../api/orderService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/orderService')>()
  return { ...actual, submitOrder: vi.fn() }
})

const cartItem = makeCartItem({ productId: 1, priceCents: 10000, quantity: 1 })

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

async function openCheckout() {
  const rendered = renderRoute('/checkout')
  await screen.findByRole('heading', { level: 1, name: 'Finalizar compra' }, { timeout: 5000 })
  return rendered
}

function summary() {
  return within(screen.getByRole('region', { name: 'Resumo do pedido' }))
}

function summaryValue(term: string) {
  return summary()
    .getByText(term)
    .nextElementSibling?.textContent?.replace(/\u00a0/g, ' ')
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
      await screen.findByRole('heading', { level: 1, name: 'Finalizar compra' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Carregando…')).not.toBeInTheDocument()
  })

  it('o total de cada item do resumo é lido com rótulo', async () => {
    await openCheckout()

    expect(summary().getByRole('listitem')).toHaveTextContent(/Total do item: US\$ 100,00/)
  })

  it('carrinho vazio redireciona para /cart', async () => {
    localStorage.clear()

    const { router } = renderRoute('/checkout')

    expect(
      await screen.findByText('Seu carrinho está vazio.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
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

  it('enviar com erro não trava o formulário nem anuncia o envio', async () => {
    const { user } = await openCheckout()
    const sightings: string[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && (record.target as Element).hasAttribute('disabled')) {
          sightings.push(`disabled em <${(record.target as Element).tagName.toLowerCase()}>`)
        }
        for (const node of record.addedNodes) {
          if (node.textContent?.includes('Enviando pedido…')) sightings.push('Enviando pedido…')
        }
      }
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled'],
    })

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))
    await screen.findByText('Informe nome e sobrenome')
    observer.disconnect()

    expect(sightings.filter((sighting) => !sighting.includes('<button>'))).toEqual([])
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
  })

  it('CPF recebe máscara', async () => {
    const { user } = await openCheckout()

    await user.type(screen.getByLabelText('CPF'), '52998224725')

    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
  })

  it('telefone pede ao autopreenchimento o número sem o código do país', async () => {
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

  it('trocar a forma de pagamento e voltar mantém o cartão digitado', async () => {
    const { user } = await openCheckout()
    await fillCard(user, '4242424242424242')
    await user.selectOptions(screen.getByLabelText('Parcelamento'), '3')

    await user.click(screen.getByRole('radio', { name: 'Pix' }))
    expect(screen.queryByLabelText('Número do cartão')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Cartão de crédito' }))

    expect(screen.getByLabelText('Número do cartão')).toHaveValue('4242 4242 4242 4242')
    expect(screen.getByLabelText('Nome impresso no cartão')).toHaveValue('ANA SOUZA')
    expect(screen.getByLabelText('Validade (MM/AA)')).toHaveValue('12/99')
    expect(screen.getByLabelText('CVV')).toHaveValue('123')
    expect(screen.getByLabelText('Parcelamento')).toHaveValue('3')
    expect(screen.getByLabelText('Parcelamento')).toHaveAccessibleDescription(
      'A primeira parcela é de US$\u00a033,34.',
    )
    expect(sessionStorage.getItem(CHECKOUT_DRAFT_KEY)).not.toContain('4242')
  })

  it('pedido por Pix depois de digitar o cartão não envia o cartão', async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      orderId: 'AB12CD34',
      totalCents: 10490,
      paymentMethod: 'pix',
      shippingCents: 990,
      deliveryDays: 3,
    })
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4242424242424242')
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    await waitFor(() => expect(submitOrder).toHaveBeenCalledTimes(1))
    expect(vi.mocked(submitOrder).mock.calls[0][0].payment).toEqual({ method: 'pix' })
  })

  it('cartão inválido já apontado no envio volta com o erro ao escolher cartão de novo', async () => {
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '1234567890123456')
    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))
    await screen.findByText('Número de cartão inválido')

    await user.click(screen.getByRole('radio', { name: 'Pix' }))
    await user.click(screen.getByRole('radio', { name: 'Cartão de crédito' }))

    const cardNumber = screen.getByLabelText('Número do cartão')
    expect(cardNumber).toHaveValue('1234 5678 9012 3456')
    expect(await screen.findByText('Número de cartão inválido')).toBeInTheDocument()
    expect(cardNumber).toHaveAttribute('aria-invalid', 'true')
  })

  it('setas do teclado no grupo de pagamento não apagam o cartão', async () => {
    const { user } = await openCheckout()
    await fillCard(user, '4242424242424242')
    const card = screen.getByRole('radio', { name: 'Cartão de crédito' })

    await user.click(card)
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Pix' })).toBeChecked()
    expect(screen.queryByLabelText('Número do cartão')).not.toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')

    expect(card).toBeChecked()
    expect(screen.getByLabelText('Número do cartão')).toHaveValue('4242 4242 4242 4242')
  })

  it('pedido aprovado limpa o carrinho e vai para a confirmação', async () => {
    const confirmation = {
      orderId: 'AB12CD34',
      totalCents: 10490,
      paymentMethod: 'pix' as const,
      shippingCents: 990,
      deliveryDays: 3,
    }
    vi.mocked(submitOrder).mockResolvedValue(confirmation)
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Pedido confirmado!' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/checkout/success')
    expect(router.state.location.state).toEqual(confirmation)
    expect(await screen.findByRole('link', { name: 'Carrinho (0 itens)' })).toBeInTheDocument()
    expect(submitOrder).toHaveBeenCalledTimes(1)
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 10490,
        shippingCents: 990,
        deliveryDays: 3,
        items: [cartItem],
        payment: { method: 'pix' },
        customer: expect.objectContaining({ cpf: '529.982.247-25' }),
      }),
    )
    await waitFor(() => expect(loadCart().items).toEqual([]))
    expect(loadCheckoutDraft()).toBeNull()
  })

  it('cartão aprovado envia os dados do cartão e o parcelamento', async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      orderId: 'AB12CD34',
      totalCents: 10990,
      paymentMethod: 'credit_card',
      shippingCents: 990,
      deliveryDays: 3,
    })
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4242424242424242')
    await user.selectOptions(screen.getByLabelText('Parcelamento'), '3')

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout/success'), {
      timeout: 5000,
    })
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 10990,
        payment: expect.objectContaining({
          method: 'credit_card',
          cardNumber: '4242 4242 4242 4242',
          installments: 3,
        }),
      }),
    )
  })

  it('digitar o CEP mostra e anuncia o frete, e ele entra no total', async () => {
    const { user } = await openCheckout()
    expect(summaryValue('Frete')).toBe('a calcular')
    expect(summaryValue('Total')).toBe('US$ 100,00')

    await fill(user, 'CEP', '0131010')
    expect(screen.queryByText(/Frete para este CEP/)).not.toBeInTheDocument()
    expect(summaryValue('Frete')).toBe('a calcular')

    await user.type(screen.getByLabelText('CEP'), '0')

    const hint = screen.getByText('Frete para este CEP: US$ 9,90, até 3 dias úteis.')
    expect(hint).toHaveAttribute('role', 'status')
    expect(screen.getByLabelText('CEP')).toHaveAccessibleDescription(
      'Frete para este CEP: US$\u00a09,90, até 3 dias úteis.',
    )
    expect(summaryValue('Frete')).toBe('US$ 9,90')
    expect(summaryValue('Total')).toBe('US$ 109,90')
  })

  it('Pix desconta só os produtos, não o frete', async () => {
    const { user } = await openCheckout()
    await fill(user, 'CEP', '69005000')

    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    expect(summaryValue('Subtotal')).toBe('US$ 100,00')
    expect(summaryValue('Desconto')).toBe('-US$ 5,00')
    expect(summaryValue('Frete')).toBe('US$ 29,90')
    expect(summaryValue('Total')).toBe('US$ 124,90')
  })

  it('frete grátis a partir de US$ 300,00 de produtos', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 15000, quantity: 2 })])
    const { user } = await openCheckout()

    await fill(user, 'CEP', '69005000')

    expect(screen.getByText('Frete grátis para este CEP, até 10 dias úteis.')).toHaveAttribute(
      'role',
      'status',
    )
    expect(summaryValue('Frete')).toBe('Grátis')
    expect(summaryValue('Total')).toBe('US$ 300,00')
  })

  it('o parcelamento é sobre o total com frete', async () => {
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)

    expect(
      screen.getByRole('option', { name: '2x de US$\u00a054,95 sem juros' }),
    ).toBeInTheDocument()
  })

  it('as regiões vivas não anunciam valores de carrinho vazio ao concluir o pedido', async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      orderId: 'AB12CD34',
      totalCents: 10990,
      paymentMethod: 'credit_card',
      shippingCents: 990,
      deliveryDays: 3,
    })
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4242424242424242')
    await user.selectOptions(screen.getByLabelText('Parcelamento'), '7')
    const statusTexts = () =>
      [...document.querySelectorAll('[role="status"]')].map((region) => region.textContent ?? '')
    const before = new Set(statusTexts())
    const seen = new Set<string>()
    const observer = new MutationObserver(() => {
      for (const text of statusTexts()) if (text && !before.has(text)) seen.add(text)
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout/success'), {
      timeout: 5000,
    })
    observer.disconnect()

    expect([...seen].filter((text) => /parcela|Frete/.test(text))).toEqual([])
  })

  it('o pedido leva o frete e o prazo da zona do CEP', async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      orderId: 'AB12CD34',
      totalCents: 11990,
      paymentMethod: 'boleto',
      shippingCents: 1990,
      deliveryDays: 6,
    })
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.clear(screen.getByLabelText('CEP'))
    await fill(user, 'CEP', '70040010')
    await user.click(screen.getByRole('radio', { name: 'Boleto' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout/success'), {
      timeout: 5000,
    })
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ shippingCents: 1990, deliveryDays: 6, totalCents: 11990 }),
    )
  })

  it('frete grátis é medido pelos produtos, antes do desconto do Pix', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 30000, quantity: 1 })])
    const { user } = await openCheckout()
    await fill(user, 'CEP', '01310100')
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    expect(screen.getByText('Frete grátis para este CEP, até 3 dias úteis.')).toBeInTheDocument()
    expect(summaryValue('Desconto')).toBe('-US$ 15,00')
    expect(summaryValue('Frete')).toBe('Grátis')
    expect(summaryValue('Total')).toBe('US$ 285,00')
  })

  it('sem desconto a linha "Desconto" não aparece', async () => {
    await openCheckout()

    expect(summary().queryByText('Desconto')).not.toBeInTheDocument()
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

  it('enquanto envia, o formulário fica travado e o envio é anunciado', async () => {
    vi.mocked(submitOrder).mockReturnValue(new Promise(() => {}))
    const { user } = await openCheckout()
    await fillCustomerAndAddress(user)
    await user.click(screen.getByRole('radio', { name: 'Pix' }))

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByText('Enviando pedido…')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Boleto' })).toBeDisabled()
  })

  it('carrinho esvaziado em outra aba leva para /cart', async () => {
    const { router } = await openCheckout()

    act(() => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [] }))
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }))
    })

    expect(await screen.findByText('Seu carrinho está vazio.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/cart')
  })

  it('cartão recusado mostra o erro e mantém o formulário', async () => {
    vi.mocked(submitOrder).mockRejectedValue(new PaymentDeclinedError())
    const { user, router } = await openCheckout()
    await fillCustomerAndAddress(user)
    await fillCard(user, '4000000000000002')

    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Pagamento recusado pela operadora do cartão. Tente outro cartão ou outra forma de pagamento.',
    )
    expect(alert).not.toHaveFocus()
    expect(document.activeElement).toContainElement(alert)
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
