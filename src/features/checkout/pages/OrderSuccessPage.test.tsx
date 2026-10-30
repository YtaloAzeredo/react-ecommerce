import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { catalogHandlers } from '@/test/catalogHandlers'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

describe('OrderSuccessPage', () => {
  beforeEach(() => {
    // Sem confirmação válida a página manda para o catálogo, que busca produtos ao abrir.
    server.use(...catalogHandlers())
  })

  it('mostra o número, o total e a forma de pagamento', async () => {
    renderRoute('/checkout/success', {
      state: { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'pix' },
    })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pedido confirmado!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('AB12CD34')).toBeInTheDocument()
    expect(screen.getByText('US$ 95,00')).toBeInTheDocument()
    expect(screen.getByText('Pix')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar comprando' })).toHaveAttribute('href', '/')
  })

  it('sem estado redireciona para a loja', async () => {
    const { router } = renderRoute('/checkout/success')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('estado inválido redireciona para a loja', async () => {
    for (const state of [
      { orderId: 123, totalCents: 9500, paymentMethod: 'pix' },
      { orderId: 'AB12CD34', totalCents: '95', paymentMethod: 'pix' },
      { orderId: 'AB12CD34', totalCents: 9500, paymentMethod: 'cheque' },
      'AB12CD34',
    ]) {
      const { router, unmount } = renderRoute('/checkout/success', { state })

      await waitFor(() => expect(router.state.location.pathname).toBe('/'))
      unmount()
    }
  })
})
