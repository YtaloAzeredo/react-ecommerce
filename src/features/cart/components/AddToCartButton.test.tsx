import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productDetailHandler } from '@/test/catalogHandlers'
import { makeProductDto } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'
import { CART_STORAGE_KEY } from '../model/cartStorage'

async function openProduct(stock: number) {
  server.use(productDetailHandler({ products: [makeProductDto({ id: 5, stock })] }))
  const rendered = renderRoute('/products/5')
  await screen.findByRole('heading', { level: 1, name: 'Produto 5' })
  return rendered
}

describe('AddToCartButton', () => {
  it('adicionar atualiza o contador do cabeçalho', async () => {
    const { user } = await openProduct(10)
    expect(screen.getByRole('link', { name: 'Carrinho (0 itens)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('link', { name: 'Carrinho (1 item)' })).toBeInTheDocument()
    expect(
      screen.getByText('Adicionado ao carrinho. Quantidade no carrinho: 1.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/cart')

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('link', { name: 'Carrinho (2 itens)' })).toBeInTheDocument()
    expect(
      screen.getByText('Adicionado ao carrinho. Quantidade no carrinho: 2.'),
    ).toBeInTheDocument()
  })

  it('produto esgotado desabilita o botão', async () => {
    await openProduct(0)

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled()
  })

  it('limite de estoque deixa o botão indisponível sem perder o foco', async () => {
    const { user } = await openProduct(1)
    const button = screen.getByRole('button', { name: 'Adicionar ao carrinho' })

    await user.click(button)
    await user.click(button)

    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Carrinho (1 item)' })).toBeInTheDocument()
    expect(
      screen.getByText('Todo o estoque deste produto já está no carrinho.'),
    ).toBeInTheDocument()
  })

  it('o motivo do limite de estoque descreve o botão indisponível', async () => {
    const { user } = await openProduct(1)
    const button = screen.getByRole('button', { name: 'Adicionar ao carrinho' })

    await user.click(button)

    expect(button).toHaveAccessibleDescription('Todo o estoque deste produto já está no carrinho.')
  })

  it('carrinho esvaziado em outra aba apaga o status de adicionado', async () => {
    const { user } = await openProduct(10)
    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))
    expect(
      screen.getByText('Adicionado ao carrinho. Quantidade no carrinho: 1.'),
    ).toBeInTheDocument()

    act(() => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [] }))
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }))
    })

    expect(screen.getByRole('link', { name: 'Carrinho (0 itens)' })).toBeInTheDocument()
    expect(screen.queryByText(/Adicionado ao carrinho/)).not.toBeInTheDocument()
  })
})
