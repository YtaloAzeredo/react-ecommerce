import { act, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '@/shared/api/http'
import { productDetailHandler } from '@/test/catalogHandlers'
import { makeProductDto, makeProductListDto } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/queryClient'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'
import { toProductPage } from '../api/productAdapter'
import { productKeys } from '../queries'

describe('ProductDetailPage', () => {
  it('abre na hora com os dados da lista', async () => {
    server.use(
      productDetailHandler({
        products: [makeProductDto({ id: 5, title: 'Completo' })],
        delayMs: 50,
      }),
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto([makeProductDto({ id: 5, title: 'Da lista' })]), 1, 12),
    )

    renderRoute('/products/5', { queryClient })

    expect(screen.getByRole('heading', { level: 1, name: 'Da lista' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Completo' })).toBeInTheDocument()
  })

  it('mostra preço, marca, nota e estoque', async () => {
    server.use(
      productDetailHandler({
        products: [makeProductDto({ id: 5, price: 19.99, brand: 'Acme', rating: 4.56, stock: 7 })],
      }),
    )

    renderRoute('/products/5')

    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 5' })).toBeInTheDocument()
    expect(screen.getByText('US$ 19,99')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Nota 4,6 de 5')).toBeInTheDocument()
    expect(screen.getByText('Em estoque: 7')).toBeInTheDocument()
  })

  it('produto sem estoque aparece como esgotado', async () => {
    server.use(productDetailHandler({ products: [makeProductDto({ id: 5, stock: 0 })] }))

    renderRoute('/products/5')

    expect(await screen.findByText('Esgotado', { selector: 'p' })).toBeInTheDocument()
  })

  it('id que não é número mostra produto não encontrado sem chamar a API', async () => {
    let requests = 0
    server.use(
      http.get(`${API_URL}/*`, () => {
        requests++
        return HttpResponse.json({})
      }),
    )

    renderRoute('/products/abc')

    expect(screen.getByText('Produto não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    expect(requests).toBe(0)
  })

  it('produto inexistente mostra produto não encontrado', async () => {
    server.use(productDetailHandler({ products: [] }))

    renderRoute('/products/99999')

    expect(await screen.findByText('Produto não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('erro na API mostra mensagem e permite tentar de novo', async () => {
    server.use(
      http.get(`${API_URL}/products/5`, () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
      productDetailHandler(),
    )
    const { user } = renderRoute('/products/5')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o produto.',
    )
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 5' })).toHaveFocus()
  })

  it('confirmar o produto de novo com sucesso leva o foco para o título', async () => {
    server.use(
      http.get(`${API_URL}/products/5`, () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
      productDetailHandler(),
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto([makeProductDto({ id: 5, title: 'Da lista' })]), 1, 12),
    )
    const { user } = renderRoute('/products/5', { queryClient })
    await screen.findByText('Não foi possível confirmar os dados mais recentes deste produto.')

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 5' })).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('erro depois do dado provisório mantém o produto na tela com um aviso', async () => {
    server.use(http.get(`${API_URL}/products/5`, () => new HttpResponse(null, { status: 500 })))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto([makeProductDto({ id: 5, title: 'Da lista' })]), 1, 12),
    )

    renderRoute('/products/5', { queryClient })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível confirmar os dados mais recentes deste produto.',
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Da lista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('tentar carregar o produto de novo avisa que está tentando e volta ao erro se falhar', async () => {
    server.use(
      http.get(`${API_URL}/products/5`, async () => {
        await delay(50)
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/products/5')
    await screen.findByText('Não foi possível carregar o produto.')
    const retry = screen.getByRole('button', { name: 'Tentar novamente' })

    await user.click(retry)

    expect(await screen.findByText('Tentando novamente…')).toBeInTheDocument()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveFocus()
    expect(await screen.findByText('Não foi possível carregar o produto.')).toBeInTheDocument()
    expect(retry).not.toHaveAttribute('aria-disabled')
    expect(retry).toHaveFocus()
  })

  it('tentar confirmar o produto de novo avisa que está tentando e mantém o produto na tela', async () => {
    server.use(
      http.get(`${API_URL}/products/5`, async () => {
        await delay(50)
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto([makeProductDto({ id: 5, title: 'Da lista' })]), 1, 12),
    )
    const { user } = renderRoute('/products/5', { queryClient })
    await screen.findByText('Não foi possível confirmar os dados mais recentes deste produto.')
    const retry = screen.getByRole('button', { name: 'Tentar novamente' })

    await user.click(retry)

    expect(await screen.findByText('Tentando novamente…')).toBeInTheDocument()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Da lista' })).toBeInTheDocument()
    expect(
      await screen.findByText('Não foi possível confirmar os dados mais recentes deste produto.'),
    ).toBeInTheDocument()
    expect(retry).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Da lista' })).toBeInTheDocument()
  })

  it('depois de uma nova tentativa que falhou, um sucesso posterior não rouba o foco', async () => {
    let failing = true
    server.use(
      http.get(`${API_URL}/products/5`, async () => {
        await delay(20)
        return failing
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(makeProductDto({ id: 5 }))
      }),
    )
    const queryClient = createTestQueryClient()
    const { user } = renderRoute('/products/5', { queryClient })
    await screen.findByText('Não foi possível carregar o produto.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Não foi possível carregar o produto.')).toBeInTheDocument()

    failing = false
    const back = screen.getByRole('link', { name: 'Voltar' })
    act(() => back.focus())
    await act(() => queryClient.refetchQueries({ queryKey: productKeys.detail(5) }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 5' })).not.toHaveFocus()
    expect(back).toHaveFocus()
  })

  it('Voltar leva ao catálogo quando a pessoa entrou direto pelo link', async () => {
    server.use(productDetailHandler())
    const { router, user } = renderRoute('/products/5')
    await screen.findByRole('heading', { level: 1, name: 'Produto 5' })

    server.use(http.get(`${API_URL}/*`, () => HttpResponse.json({ products: [], total: 0 })))
    await user.click(screen.getByRole('link', { name: 'Voltar' }))

    expect(router.state.location.pathname).toBe('/')
  })
})
