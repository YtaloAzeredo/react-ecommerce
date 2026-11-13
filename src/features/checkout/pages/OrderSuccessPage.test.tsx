import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { catalogHandlers } from '@/test/catalogHandlers'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

describe('OrderSuccessPage', () => {
  beforeEach(() => {
    server.use(...catalogHandlers())
  })

  it('mostra o número, o total e a forma de pagamento', async () => {
    renderRoute('/checkout/success', {
      state: {
        orderId: 'AB12CD34',
        totalCents: 10490,
        paymentMethod: 'pix',
        shippingCents: 990,
        deliveryDays: 3,
      },
    })

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Pedido confirmado!' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('AB12CD34')).toBeInTheDocument()
    expect(screen.getByText('US$ 104,90')).toBeInTheDocument()
    expect(screen.getByText('Pix')).toBeInTheDocument()
    expect(screen.getByText('Frete').nextElementSibling).toHaveTextContent('US$ 9,90')
    expect(screen.getByText('Entrega').nextElementSibling).toHaveTextContent('até 3 dias úteis')
    expect(screen.getByRole('link', { name: 'Continuar comprando' })).toHaveAttribute('href', '/')
  })

  it('frete zero aparece como grátis', async () => {
    renderRoute('/checkout/success', {
      state: {
        orderId: 'AB12CD34',
        totalCents: 30000,
        paymentMethod: 'boleto',
        shippingCents: 0,
        deliveryDays: 6,
      },
    })

    await screen.findByRole('heading', { level: 1, name: 'Pedido confirmado!' }, { timeout: 5000 })
    expect(screen.getByText('Frete').nextElementSibling).toHaveTextContent('Grátis')
    expect(screen.getByText('Entrega').nextElementSibling).toHaveTextContent('até 6 dias úteis')
  })

  it('confirmação sem frete (formato antigo) redireciona para a loja', async () => {
    const { router } = renderRoute('/checkout/success', {
      state: { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'pix' },
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('sem estado redireciona para a loja', async () => {
    const { router } = renderRoute('/checkout/success')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 5000 })
  })

  it('estado inválido redireciona para a loja', async () => {
    for (const state of [
      { orderId: 123, totalCents: 9500, paymentMethod: 'pix' },
      { orderId: 'AB12CD34', totalCents: '95', paymentMethod: 'pix' },
      { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'cheque' },
      { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'pix', shippingCents: 0 },
      { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'pix', deliveryDays: 3 },
      'AB12CD34',
    ]) {
      const { router, unmount } = renderRoute('/checkout/success', { state })

      await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 5000 })
      unmount()
    }
  })
})
