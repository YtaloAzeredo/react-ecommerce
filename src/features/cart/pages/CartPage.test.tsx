import { act, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeCartItem, seedCart } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { CART_STORAGE_KEY } from '../model/cartStorage'

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

  it('o total da linha é lido com o rótulo "Total"', () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, quantity: 2 })])

    renderRoute('/cart')

    expect(screen.getByRole('listitem')).toHaveTextContent('Total: US$ 19,98')
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

  it('diminuir em 1 fica indisponível sem perder o foco', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, quantity: 2 })])
    const { user } = renderRoute('/cart')
    const decrease = screen.getByRole('button', { name: 'Diminuir quantidade de Produto 1' })

    await user.click(decrease)
    await user.click(decrease)

    expect(decrease).toHaveAttribute('aria-disabled', 'true')
    expect(decrease).toHaveFocus()
    expect(summary().getByText('US$ 9,99')).toBeInTheDocument()
  })

  it('aumentar no limite do estoque fica indisponível sem perder o foco', async () => {
    seedCart([makeCartItem({ productId: 1, priceCents: 999, maxQuantity: 2, quantity: 1 })])
    const { user } = renderRoute('/cart')
    const increase = screen.getByRole('button', { name: 'Aumentar quantidade de Produto 1' })

    await user.click(increase)
    await user.click(increase)

    expect(increase).toHaveAttribute('aria-disabled', 'true')
    expect(increase).toHaveFocus()
    expect(increase).toHaveAccessibleDescription('Só há 2 em estoque.')
    expect(summary().getByText('US$ 19,98')).toBeInTheDocument()
  })

  it('o subtotal fica numa região que anuncia as mudanças', () => {
    seedCart([makeCartItem()])

    renderRoute('/cart')

    expect(summary().getByText('Subtotal').closest('[aria-live="polite"]')).not.toBeNull()
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

  it('chegar ao estoque explica o limite e anuncia', async () => {
    seedCart([makeCartItem({ productId: 1, maxQuantity: 5, quantity: 1 })])
    const { user } = renderRoute('/cart')
    const line = within(screen.getByRole('listitem'))
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })
    const increase = screen.getByRole('button', { name: 'Aumentar quantidade de Produto 1' })
    const status = line.getByRole('status')
    expect(status).toBeEmptyDOMElement()
    expect(input).not.toHaveAccessibleDescription()

    await user.clear(input)
    await user.type(input, '9')

    expect(status).toHaveTextContent('Só há 5 em estoque, não 9.')
    expect(input).toHaveAccessibleDescription('Só há 5 em estoque, não 9.')
    expect(increase).toHaveAccessibleDescription('Só há 5 em estoque, não 9.')

    await user.click(screen.getByRole('button', { name: 'Diminuir quantidade de Produto 1' }))

    expect(status).toBeEmptyDOMElement()
    expect(input).not.toHaveAccessibleDescription()
    expect(increase).not.toHaveAccessibleDescription()
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

  it('remover leva o foco para o título do carrinho', async () => {
    seedCart([makeCartItem({ productId: 1 }), makeCartItem({ productId: 2 })])
    const { user } = renderRoute('/cart')

    await user.click(screen.getByRole('button', { name: 'Remover Produto 1' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Carrinho' })).toHaveFocus()
  })

  it('esvaziar o carrinho anuncia que ele ficou vazio', async () => {
    seedCart([makeCartItem({ productId: 1 })])
    const { user } = renderRoute('/cart')
    const [status] = within(screen.getByRole('main'))
      .getAllByRole('status')
      .filter((element) => !element.closest('li'))
    expect(status).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: 'Remover Produto 1' }))

    expect(status).toHaveTextContent('Seu carrinho está vazio.')
  })

  it('digitar acima do estoque já no limite muda o aviso para ser anunciado de novo', async () => {
    seedCart([makeCartItem({ productId: 1, maxQuantity: 5, quantity: 5 })])
    const { user } = renderRoute('/cart')
    const status = within(screen.getByRole('listitem')).getByRole('status')
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })
    expect(status).toHaveTextContent('Só há 5 em estoque.')

    await user.clear(input)
    await user.type(input, '9')

    expect(input).toHaveValue(5)
    expect(status).toHaveTextContent('Só há 5 em estoque, não 9.')

    await user.click(screen.getByRole('button', { name: 'Diminuir quantidade de Produto 1' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Produto 1' }))

    expect(status).toHaveTextContent('Só há 5 em estoque.')
  })

  it('mudança vinda de outra aba não traz de volta o número pedido antes', async () => {
    seedCart([makeCartItem({ productId: 1, maxQuantity: 5, quantity: 5 })])
    const { user } = renderRoute('/cart')
    const status = within(screen.getByRole('listitem')).getByRole('status')
    const input = screen.getByRole('spinbutton', { name: 'Quantidade de Produto 1' })
    await user.clear(input)
    await user.type(input, '9')
    expect(status).toHaveTextContent('Só há 5 em estoque, não 9.')

    const otherTabSets = (quantity: number) =>
      act(() => {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify({ items: [makeCartItem({ productId: 1, maxQuantity: 5, quantity })] }),
        )
        window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }))
      })
    otherTabSets(3)
    expect(status).toBeEmptyDOMElement()
    otherTabSets(5)

    expect(input).toHaveValue(5)
    expect(status).toHaveTextContent('Só há 5 em estoque.')
  })

  it('carrinho corrompido no storage abre vazio', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{nao é json')

    renderRoute('/cart')

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
