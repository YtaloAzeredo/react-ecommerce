import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { catalogHandlers } from '@/test/catalogHandlers'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

describe('CartLink', () => {
  it('o nome acessível vem do conteúdo do link, sem aria-label', async () => {
    server.use(...catalogHandlers())
    seedCart([makeCartItem({ productId: 1, quantity: 1 })])
    renderRoute('/')

    const link = await screen.findByRole('link', { name: 'Carrinho (1 item)' })

    expect(link).not.toHaveAttribute('aria-label')
    expect(link).toHaveTextContent(/^Carrinho\s*1/)
  })
})
