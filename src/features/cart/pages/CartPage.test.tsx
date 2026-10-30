import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'

function summary() {
  return within(screen.getByRole('region', { name: 'Resumo' }))
}

describe('CartPage', () => {
  it('carrinho vazio', () => {
    renderRoute('/cart')

    expect(screen.getByText('Seu carrinho está vazio.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/')
  })

  it('mostra a linha com link para o produto, preço unitário e total', () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, quantity: 2 })])

    renderRoute('/cart')

    expect(screen.getByRole('link', { name: 'Produto 1' })).toHaveAttribute('href', '/products/1')
    expect(screen.getByText('US$ 9,99 cada')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })).toHaveValue(2)
    expect(summary().getByText('US$ 19,98')).toBeInTheDocument()
  })

  it('aumentar e diminuir atualizam o subtotal', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, maxQuantity: 5, quantity: 1 })])
    const { user } = renderRoute('/cart')

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Produto 1' }))

    expect(summary().getByText('US$ 19,98')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Carrinho (2 itens)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Diminuir quantidade de Produto 1' }))

    expect(summary().getByText('US$ 9,99')).toBeInTheDocument()
  })

  it('diminuir fica desabilitado em 1', () => {
    seedCart([makeCartItem({ productId: 1, quantity: 1 })])

    renderRoute('/cart')

    expect(screen.getByRole('button', { name: 'Diminuir quantidade de Produto 1' })).toBeDisabled()
  })

  it('aumentar fica desabilitado no limite do estoque', () => {
    seedCart([makeCartItem({ productId: 1, maxQuantity: 3, quantity: 3 })])

    renderRoute('/cart')

    expect(screen.getByRole('button', { name: 'Aumentar quantidade de Produto 1' })).toBeDisabled()
  })

  it('digitar a quantidade atualiza o subtotal', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, maxQuantity: 5, quantity: 1 })])
    const { user } = renderRoute('/cart')
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })

    await user.clear(input)
    await user.type(input, '3')

    expect(summary().getByText('US$ 29,97')).toBeInTheDocument()
  })

  it('quantidade digitada acima do estoque fica no estoque', async () => {
    seedCart([makeCartItem({ productId: 1, maxQuantity: 5, quantity: 1 })])
    const { user } = renderRoute('/cart')
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })

    await user.clear(input)
    await user.type(input, '9')

    expect(input).toHaveValue(5)
  })

  it('apagar o campo de quantidade não remove o item', async () => {
    seedCart([makeCartItem({ productId: 1, quantity: 2 })])
    const { user } = renderRoute('/cart')
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })

    await user.clear(input)
    await user.tab()

    expect(input).toHaveValue(2)
    expect(screen.queryByText('Seu carrinho está vazio.')).not.toBeInTheDocument()
  })

  it('remover tira a linha', async () => {
    seedCart([makeCartItem({ productId: 1 })])
    const { user } = renderRoute('/cart')

    await user.click(screen.getByRole('button', { name: 'Remover Produto 1' }))

    expect(screen.getByText('Seu carrinho está vazio.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Carrinho (0 itens)' })).toBeInTheDocument()
  })

  it('finalizar compra leva ao checkout', () => {
    seedCart([makeCartItem()])

    renderRoute('/cart')

    expect(screen.getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute(
      'href',
      '/checkout',
    )
  })
})
