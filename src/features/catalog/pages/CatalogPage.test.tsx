import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '@/shared/api/http'
import {
  catalogHandlers,
  categoryProductsHandler,
  productListHandler,
} from '@/test/catalogHandlers'
import { makeProductDto } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

// O nome acessível do card é "título preço"; o espaço depois do número evita "Produto 1" casar com "Produto 13".
const productLink = (id: number) => new RegExp(`^Produto ${id} `)

// O jsdom não rola; simulamos a posição para o ScrollRestoration salvar e restaurar.
function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true })
}

describe('CatalogPage', () => {
  beforeEach(() => {
    server.use(...catalogHandlers())
  })

  it('mostra os produtos da página pedida na URL', async () => {
    renderRoute('/?page=2')

    expect(screen.getByRole('status')).toHaveTextContent('Carregando produtos…')
    expect(await screen.findByRole('link', { name: productLink(13) })).toHaveAttribute(
      'href',
      '/products/13',
    )
    expect(screen.getByRole('link', { name: productLink(24) })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: productLink(12) })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: productLink(25) })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('página inválida cai na página 1', async () => {
    renderRoute('/?page=abc')

    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('página acima do total redireciona para a última', async () => {
    const { router } = renderRoute('/?page=99')

    await waitFor(() => expect(router.state.location.search).toBe('?page=3'))
    expect(router.state.historyAction).toBe('REPLACE')
    expect(await screen.findByRole('link', { name: productLink(25) })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('categoria sem produtos mostra estado vazio', async () => {
    const { router } = renderRoute('/?category=nao-existe')

    expect(await screen.findByText('Nenhum produto encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todos os produtos' })).toHaveAttribute('href', '/')
    expect(router.state.location.search).toBe('?category=nao-existe')
  })

  it('"Ver todos os produtos" sai do estado vazio na hora', async () => {
    server.use(productListHandler({ delayMs: 50 }))
    const { user } = renderRoute('/?category=nao-existe')
    await screen.findByText('Nenhum produto encontrado.')

    await user.click(screen.getByRole('link', { name: 'Ver todos os produtos' }))

    expect(screen.queryByText('Nenhum produto encontrado.')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando produtos…')
    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()
  })

  it('erro na API mostra mensagem e permite tentar de novo', async () => {
    server.use(
      http.get(`${API_URL}/products`, () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    )
    const { user } = renderRoute('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os produtos.',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('trocar a categoria volta para a página 1', async () => {
    const { router, user } = renderRoute('/?page=2')
    await screen.findByRole('link', { name: productLink(13) })
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    expect(router.state.location.search).toBe('?category=smartphones')
    expect(await screen.findByRole('heading', { name: 'Smartphones' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: productLink(21) })).toBeInTheDocument()
  })

  it('mostra o preço formatado no card', async () => {
    server.use(
      categoryProductsHandler({
        products: [makeProductDto({ id: 99, category: 'beauty', price: 1099.99 })],
      }),
    )
    renderRoute('/?category=beauty')

    // toHaveTextContent normaliza o espaço não separável do preço para um espaço comum.
    expect(await screen.findByRole('link', { name: productLink(99) })).toHaveTextContent(
      'US$ 1.099,99',
    )
  })

  it('voltar do detalhe mostra a lista na hora, sem nova requisição', async () => {
    let pageTwoRequests = 0
    server.use(
      productListHandler({
        onRequest: (url) => {
          if (url.searchParams.get('skip') === '12') pageTwoRequests++
        },
      }),
    )
    const { router, user } = renderRoute('/?page=2')
    await user.click(await screen.findByRole('link', { name: productLink(13) }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Produto 13' })).toBeInTheDocument()

    await act(() => router.navigate(-1))

    expect(router.state.location.search).toBe('?page=2')
    expect(screen.getByRole('link', { name: productLink(13) })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(pageTwoRequests).toBe(1)
  })

  it('o link Voltar do detalhe leva de volta à mesma página do catálogo', async () => {
    const { router, user } = renderRoute('/?page=2')
    await user.click(await screen.findByRole('link', { name: productLink(13) }))

    await user.click(await screen.findByRole('link', { name: 'Voltar' }))

    expect(router.state.location.search).toBe('?page=2')
    expect(screen.getByRole('link', { name: productLink(13) })).toBeInTheDocument()
  })

  it('voltar do detalhe restaura a posição de rolagem com a lista já na tela', async () => {
    const scrolls: Array<{ y: number; listOnScreen: boolean }> = []
    vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, y: number) => {
      scrolls.push({
        y,
        listOnScreen: screen.queryByRole('link', { name: productLink(13) }) !== null,
      })
    }) as typeof window.scrollTo)
    try {
      const { router, user } = renderRoute('/?page=2')
      const card = await screen.findByRole('link', { name: productLink(13) })
      setScrollY(1500)

      await user.click(card)
      await screen.findByRole('heading', { level: 1, name: 'Produto 13' })
      // Abrir um produto é navegação nova: começa no topo.
      expect(scrolls.at(-1)?.y).toBe(0)

      setScrollY(0)
      scrolls.length = 0
      await act(() => router.navigate(-1))

      expect(scrolls).toContainEqual({ y: 1500, listOnScreen: true })
    } finally {
      setScrollY(0)
    }
  })
})
