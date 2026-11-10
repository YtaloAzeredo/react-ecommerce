import { act, screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '@/shared/api/http'
import {
  catalogCategories,
  catalogHandlers,
  catalogProducts,
  categoryProductsHandler,
  productListHandler,
} from '@/test/catalogHandlers'
import { makeProductDto, makeProductListDto } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/queryClient'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'
import { toCategory, toProductPage } from '../api/productAdapter'
import { categoryKeys, productKeys } from '../queries'

const productLink = (id: number) => new RegExp(`^Produto ${id} `)

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true })
}

function inPage() {
  return within(screen.getByRole('main'))
}

describe('CatalogPage', () => {
  beforeEach(() => {
    server.use(...catalogHandlers())
  })

  it('mostra os produtos da página pedida na URL', async () => {
    renderRoute('/?page=2')

    expect(inPage().getByRole('status')).toHaveTextContent('Carregando produtos…')
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
    expect(inPage().getByRole('status')).toHaveTextContent('Carregando produtos…')
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
    expect(screen.getByRole('heading', { level: 1, name: 'Produtos' })).toHaveFocus()
  })

  it('tentar carregar os produtos de novo avisa que está tentando e volta ao erro se falhar', async () => {
    server.use(
      http.get(`${API_URL}/products`, async () => {
        await delay(50)
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/')
    await screen.findByText('Não foi possível carregar os produtos.')
    const retry = screen.getByRole('button', { name: 'Tentar novamente' })

    await user.click(retry)

    expect(await screen.findByText('Tentando novamente…')).toBeInTheDocument()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveFocus()
    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument()
    expect(retry).not.toHaveAttribute('aria-disabled')
    expect(retry).toHaveFocus()
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

    expect(await screen.findByRole('link', { name: productLink(99) })).toHaveTextContent(
      'US$ 1.099,99',
    )
  })

  it('chegar à última página mantém o foco no link Próxima', async () => {
    const { user } = renderRoute('/?page=2')
    await screen.findByRole('link', { name: productLink(13) })

    await user.click(screen.getByRole('link', { name: 'Próxima' }))
    await screen.findByRole('link', { name: productLink(25) })

    const next = screen.getByRole('link', { name: 'Próxima' })
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(next).toHaveFocus()
  })

  it('categoria fora da lista aparece selecionada e "Todas" volta para todos os produtos', async () => {
    const { router, user } = renderRoute('/?category=nao-existe')
    await screen.findByText('Nenhum produto encontrado.')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })

    expect(select).toHaveValue('nao-existe')

    await user.selectOptions(select, 'Todas')

    expect(router.state.location.search).toBe('')
  })

  it('erro ao carregar as categorias avisa e permite tentar de novo', async () => {
    server.use(
      http.get(`${API_URL}/products/categories`, () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    )
    const { user } = renderRoute('/')

    expect(await screen.findByText('Não foi possível carregar as categorias.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Recarregar categorias' }))

    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveFocus()
    expect(await screen.findByRole('option', { name: 'Smartphones' })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar as categorias.')).not.toBeInTheDocument()
  })

  it('erro ao atualizar as categorias já em cache mantém a lista e não avisa', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(categoryKeys.all, catalogCategories.map(toCategory), {
      updatedAt: Date.now() - 10 * 60_000,
    })
    server.use(
      http.get(`${API_URL}/products/categories`, () => new HttpResponse(null, { status: 500 })),
    )

    renderRoute('/', { queryClient })

    await waitFor(() => expect(queryClient.getQueryState(categoryKeys.all)?.status).toBe('error'))
    expect(screen.getByRole('option', { name: 'Smartphones' })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar as categorias.')).not.toBeInTheDocument()
  })

  it('erro ao atualizar uma lista que já está na tela mantém a lista e avisa', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto(catalogProducts.slice(0, 12), 30), 1, 12),
      { updatedAt: Date.now() - 10 * 60_000 },
    )
    server.use(http.get(`${API_URL}/products`, () => new HttpResponse(null, { status: 500 })))

    renderRoute('/', { queryClient })

    expect(await screen.findByText('Não foi possível atualizar a lista.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('atualizar a lista de novo com sucesso leva o foco para o título', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto(catalogProducts.slice(0, 12), 30), 1, 12),
      { updatedAt: Date.now() - 10 * 60_000 },
    )
    let failed = false
    server.use(
      http.get(`${API_URL}/products`, ({ request }) => {
        if (failed || new URL(request.url).searchParams.get('skip') !== '0') return undefined
        failed = true
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/', { queryClient })
    await screen.findByText('Não foi possível atualizar a lista.')

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() =>
      expect(screen.queryByText('Não foi possível atualizar a lista.')).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Produtos' })).toHaveFocus()
  })

  it('tentar atualizar a lista de novo avisa que está tentando e volta ao erro se falhar', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto(catalogProducts.slice(0, 12), 30), 1, 12),
      { updatedAt: Date.now() - 10 * 60_000 },
    )
    server.use(
      http.get(`${API_URL}/products`, async () => {
        await delay(50)
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/', { queryClient })
    await screen.findByText('Não foi possível atualizar a lista.')

    const retry = screen.getByRole('button', { name: 'Tentar novamente' })
    await user.click(retry)

    expect(await screen.findByText('Tentando novamente…')).toBeInTheDocument()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveFocus()
    expect(await screen.findByText('Não foi possível atualizar a lista.')).toBeInTheDocument()
    expect(retry).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('link', { name: productLink(1) })).toBeInTheDocument()
  })

  it('tentar carregar uma página de novo mantém o aviso mesmo com a página anterior em cache', async () => {
    server.use(
      http.get(`${API_URL}/products`, async ({ request }) => {
        if (new URL(request.url).searchParams.get('skip') !== '12') return undefined
        await delay(50)
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    await user.click(screen.getByRole('link', { name: 'Página 2' }))
    await screen.findByText('Não foi possível carregar os produtos.')
    const retry = screen.getByRole('button', { name: 'Tentar novamente' })
    await user.click(retry)

    expect(await screen.findByText('Tentando novamente…')).toBeInTheDocument()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveFocus()
    expect(screen.queryByRole('link', { name: productLink(1) })).not.toBeInTheDocument()
    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument()
    expect(retry).toHaveFocus()
  })

  it('categoria com página além do fim vai para a última página da categoria', async () => {
    const { router } = renderRoute('/?category=beauty&page=9')

    await waitFor(() => expect(router.state.location.search).toBe('?category=beauty&page=2'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('os links da paginação mantêm a categoria', async () => {
    renderRoute('/?category=beauty')
    await screen.findByRole('link', { name: productLink(1) })

    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'href',
      '/?category=beauty&page=2',
    )
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute(
      'href',
      '/?category=beauty&page=2',
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
    expect(inPage().queryByRole('status')).not.toBeInTheDocument()
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
