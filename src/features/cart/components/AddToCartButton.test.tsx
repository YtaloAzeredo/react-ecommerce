import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productDetailHandler } from '@/test/catalogHandlers'
import { makeProductDto } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

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
    expect(screen.getByText('Adicionado ao carrinho.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/cart')

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('link', { name: 'Carrinho (2 itens)' })).toBeInTheDocument()
  })

  it('produto esgotado desabilita o botão', async () => {
    await openProduct(0)

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled()
  })

  it('limite de estoque desabilita o botão', async () => {
    const { user } = await openProduct(1)

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled()
    expect(
      screen.getByText('Todo o estoque deste produto já está no carrinho.'),
    ).toBeInTheDocument()
  })
})
