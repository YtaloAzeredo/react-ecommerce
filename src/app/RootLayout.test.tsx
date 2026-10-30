import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'

// Segura o código da página de checkout até o teste liberar, como numa rede lenta.
const checkoutCode = vi.hoisted(() => {
  let release = () => {}
  const arrived = new Promise<void>((resolve) => {
    release = resolve
  })
  return { arrived, release }
})

vi.mock('@/features/checkout/pages/CheckoutPage', async (importOriginal) => {
  await checkoutCode.arrived
  return importOriginal()
})

describe('RootLayout', () => {
  it('avisa que a próxima página está carregando enquanto o código dela chega', async () => {
    seedCart([makeCartItem()])
    const { user, router } = renderRoute('/cart')

    await user.click(screen.getByRole('link', { name: 'Finalizar compra' }))

    expect(await screen.findByText('Carregando página…')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/cart')

    checkoutCode.release()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Finalizar compra' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Carregando página…')).not.toBeInTheDocument()
  })
})
