import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
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

    // A linha de estoque; o botão de adicionar também diz "Esgotado".
    expect(await screen.findByText('Esgotado', { selector: 'p' })).toBeInTheDocument()
  })

  it('id que não é número mostra produto não encontrado sem chamar a API', () => {
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
    expect(requests).toBe(0)
  })

  it('produto inexistente mostra produto não encontrado', async () => {
    server.use(productDetailHandler({ products: [] }))

    renderRoute('/products/99999')

    expect(await screen.findByText('Produto não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('erro na API mostra mensagem e permite tentar de novo', async () => {
    // No server.use, o primeiro handler tem prioridade: o 500 de uso único vem antes do normal.
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

    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 5' })).toBeInTheDocument()
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

  it('Voltar leva ao catálogo quando a pessoa entrou direto pelo link', async () => {
    server.use(productDetailHandler())
    const { router, user } = renderRoute('/products/5')
    await screen.findByRole('heading', { level: 1, name: 'Produto 5' })

    // O catálogo busca dados ao abrir; aqui só importa para onde o link leva.
    server.use(http.get(`${API_URL}/*`, () => HttpResponse.json({ products: [], total: 0 })))
    await user.click(screen.getByRole('link', { name: 'Voltar' }))

    expect(router.state.location.pathname).toBe('/')
  })
})
