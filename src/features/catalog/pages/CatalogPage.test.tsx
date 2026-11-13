import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '@/shared/api/http'
import {
  catalogCategories,
  catalogHandlers,
  catalogProducts,
  categoryProductsHandler,
  productListHandler,
  searchProductsHandler,
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

    expect(
      inPage().getByText('Carregando produtos…').closest('[role="status"]'),
    ).toBeInTheDocument()
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
    expect(
      inPage().getByText('Carregando produtos…').closest('[role="status"]'),
    ).toBeInTheDocument()
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

  it('as quatro primeiras imagens carregam na hora e as outras sob demanda', async () => {
    renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    const images = [...screen.getByRole('main').querySelectorAll('img')]

    expect(images).toHaveLength(12)
    expect(images.slice(0, 4).map((img) => img.getAttribute('loading'))).toEqual(
      Array(4).fill('eager'),
    )
    expect(images.slice(4).map((img) => img.getAttribute('loading'))).toEqual(Array(8).fill('lazy'))
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
      productKeys.list({ page: 1, category: null, search: null, sort: null }),
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
      productKeys.list({ page: 1, category: null, search: null, sort: null }),
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
      productKeys.list({ page: 1, category: null, search: null, sort: null }),
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
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument()
    expect(retry).toHaveFocus()
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
  })

  it('erro ao abrir uma página nova mantém a paginação na tela', async () => {
    server.use(
      http.get(`${API_URL}/products`, ({ request }) => {
        if (new URL(request.url).searchParams.get('skip') !== '12') return undefined
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    await user.click(screen.getByRole('link', { name: 'Página 2' }))
    await screen.findByText('Não foi possível carregar os produtos.')

    const pagination = within(screen.getByRole('navigation', { name: 'Paginação' }))
    expect(pagination.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(pagination.getByRole('link', { name: 'Página 1' }))

    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('navegar com o teclado no select de categoria só navega ao confirmar com Enter', async () => {
    const { router } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'beauty' } })
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'smartphones' } })

    expect(select).toHaveValue('smartphones')
    expect(router.state.location.search).toBe('')

    fireEvent.keyDown(select, { key: 'Enter' })

    expect(router.state.location.search).toBe('?category=smartphones')
  })

  it('escolher no menu aberto do select de categoria navega na hora', async () => {
    const { router } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.change(select, { target: { value: 'beauty' } })

    expect(router.state.location.search).toBe('?category=beauty')
  })

  it('Espaço no select de categoria não segura a escolha seguinte', async () => {
    const { router } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: ' ' })
    fireEvent.change(select, { target: { value: 'beauty' } })

    expect(router.state.location.search).toBe('?category=beauty')
  })

  it('a URL mudar por fora descarta a escolha pendente do select de categoria', async () => {
    const { router, user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'beauty' } })

    await act(() => router.navigate('/?category=smartphones'))

    expect(select).toHaveValue('smartphones')
    await user.tab()
    expect(router.state.location.search).toBe('?category=smartphones')
  })

  it('sair do select de categoria com uma escolha pendente navega', async () => {
    const { router, user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'beauty' } })
    expect(router.state.location.search).toBe('')
    await user.tab()

    expect(router.state.location.search).toBe('?category=beauty')
  })

  it('Escape no select de categoria descarta a escolha pendente', async () => {
    const { router, user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'beauty' } })
    fireEvent.keyDown(select, { key: 'Escape' })
    await user.tab()

    expect(select).toHaveValue('')
    expect(router.state.location.search).toBe('')
  })

  it('categoria com página além do fim vai para a última página da categoria', async () => {
    const { router } = renderRoute('/?category=beauty&page=9')

    await waitFor(() => expect(router.state.location.search).toBe('?category=beauty&page=2'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('buscar leva o termo para a URL, limpa a categoria e mostra os resultados', async () => {
    const { router, user } = renderRoute('/?category=beauty&page=2')
    await screen.findByRole('link', { name: productLink(13) })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')

    expect(router.state.location.search).toBe('?q=Produto+1')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Resultados para “Produto 1”' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: productLink(10) })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: productLink(2) })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveValue('')
  })

  it('o foco fica no campo enquanto a busca carrega e vai para o título quando a lista chega', async () => {
    server.use(searchProductsHandler({ delayMs: 50 }))
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Resultados para “Produto 1”',
    })
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveFocus()
    await screen.findByRole('link', { name: productLink(10) })
    expect(heading).toHaveFocus()
  })

  it('abrir a URL com busca preenche o campo e mantém o termo na paginação', async () => {
    renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })

    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('Produto')
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'href',
      '/?q=Produto&page=2',
    )
  })

  it('busca sem resultado mostra o termo no vazio e o link para limpar a busca', async () => {
    renderRoute('/?q=zzz')

    expect(await screen.findByText('Nenhum produto encontrado para “zzz”.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Limpar busca' })).toHaveAttribute('href', '/')
  })

  it('confirmar o campo vazio tira a busca', async () => {
    const { router, user } = renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), '{Enter}')

    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('heading', { level: 1, name: 'Produtos' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Limpar busca' })).not.toBeInTheDocument()
  })

  it('confirmar o mesmo termo não navega de novo', async () => {
    const { router, user } = renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })
    const key = router.state.location.key

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), '{Enter}')

    expect(router.state.location.key).toBe(key)
  })

  it('busca só com espaços na URL conta como sem busca', async () => {
    renderRoute('/?q=%20%20')

    expect(await screen.findByRole('heading', { level: 1, name: 'Produtos' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: productLink(1) })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('')
  })

  it('escolher uma categoria durante a busca limpa a busca', async () => {
    const { router, user } = renderRoute('/?q=Produto&page=2')
    await screen.findByRole('link', { name: productLink(13) })
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    expect(router.state.location.search).toBe('?category=smartphones')
    expect(await screen.findByRole('heading', { name: 'Smartphones' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('')
  })

  it('"Limpar busca" leva o foco para o título quando a lista chega', async () => {
    const { router, user } = renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })

    await user.click(screen.getByRole('link', { name: 'Limpar busca' }))

    expect(router.state.location.search).toBe('')
    const heading = await screen.findByRole('heading', { level: 1, name: 'Produtos' })
    await screen.findByRole('link', { name: productLink(2) })
    expect(heading).toHaveFocus()
  })

  it('"Ver todos os produtos" no vazio da busca leva o foco para o título', async () => {
    const { user } = renderRoute('/?q=zzz')
    await screen.findByText('Nenhum produto encontrado para “zzz”.')

    await user.click(screen.getByRole('link', { name: 'Ver todos os produtos' }))

    await screen.findByRole('link', { name: productLink(1) })
    expect(screen.getByRole('heading', { level: 1, name: 'Produtos' })).toHaveFocus()
  })

  it('busca com erro não rouba o foco do select de categoria depois', async () => {
    server.use(
      http.get(`${API_URL}/products/search`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })
    await screen.findByRole('option', { name: 'Smartphones' })
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'abc{Enter}')
    await screen.findByText('Não foi possível carregar os produtos.')

    const select = screen.getByRole('combobox', { name: 'Categoria' })
    await user.selectOptions(select, 'Smartphones')

    await screen.findByRole('link', { name: productLink(21) })
    expect(select).toHaveFocus()
  })

  it('continuar digitando enquanto a busca carrega mantém o foco no campo', async () => {
    server.use(searchProductsHandler({ delayMs: 100 }))
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), '0')

    await screen.findByRole('link', { name: productLink(10) })
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveFocus()
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('Produto 10')
  })

  it('erro na busca sem página dela em cache não mostra a paginação do catálogo geral', async () => {
    server.use(
      http.get(`${API_URL}/products/search`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'abc{Enter}')

    await screen.findByText('Não foi possível carregar os produtos.')
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
  })

  it('erro numa página nova da busca mantém a paginação da busca', async () => {
    server.use(
      http.get(`${API_URL}/products/search`, ({ request }) => {
        if (new URL(request.url).searchParams.get('skip') !== '24') return undefined
        return new HttpResponse(null, { status: 500 })
      }),
      searchProductsHandler(),
    )
    const { user } = renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })

    await user.click(screen.getByRole('link', { name: 'Página 3' }))

    await screen.findByText('Não foi possível carregar os produtos.')
    expect(
      within(screen.getByRole('navigation', { name: 'Paginação' })).getByRole('link', {
        name: 'Página 1',
      }),
    ).toHaveAttribute('href', '/?q=Produto')
  })

  it('busca com página além do fim vai para a última página da busca', async () => {
    const { router } = renderRoute('/?q=Produto&page=99')

    await screen.findByRole('link', { name: productLink(25) })
    expect(router.state.location.search).toBe('?q=Produto&page=3')
  })

  it('o que foi digitado e não confirmado continua no campo ao paginar', async () => {
    const { user } = renderRoute('/?q=Produto')
    await screen.findByRole('link', { name: productLink(1) })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), ' x')
    await user.click(screen.getByRole('link', { name: 'Página 2' }))

    await screen.findByRole('link', { name: productLink(13) })
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('Produto x')
  })

  it('buscar de novo um termo já em cache leva o foco para o título', async () => {
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })
    const searchbox = () => screen.getByRole('searchbox', { name: 'Buscar' })
    await user.type(searchbox(), 'Produto 1{Enter}')
    await screen.findByRole('link', { name: productLink(10) })
    await user.clear(searchbox())
    await user.type(searchbox(), 'Produto 2{Enter}')
    await screen.findByRole('link', { name: productLink(20) })

    await user.clear(searchbox())
    await user.type(searchbox(), 'Produto 1{Enter}')

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Resultados para “Produto 1”',
    })
    await screen.findByRole('link', { name: productLink(10) })
    expect(heading).toHaveFocus()
  })

  it('busca e categoria juntas na URL: a busca vence', async () => {
    renderRoute('/?q=Produto%201&category=smartphones')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Resultados para “Produto 1”' }),
    ).toBeInTheDocument()
    await screen.findByRole('link', { name: productLink(10) })
    expect(screen.queryByRole('link', { name: productLink(21) })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveValue('')
  })

  it('ordenar por menor preço leva o sort para a URL, volta à página 1 e mostra a lista ordenada', async () => {
    const products = catalogProducts.map((product, index) => ({ ...product, price: 30 - index }))
    server.use(productListHandler({ products, delayMs: 50 }))
    const { router, user } = renderRoute('/?page=2')
    await screen.findByRole('link', { name: productLink(13) })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'Menor preço')

    expect(router.state.location.search).toBe('?sort=price-asc')
    expect(
      inPage().getByText('Carregando produtos…').closest('[role="status"]'),
    ).toBeInTheDocument()
    await screen.findByRole('link', { name: productLink(30) })
    const links = inPage().getAllByRole('link', { name: /^Produto \d+ / })
    expect(links[0]).toHaveAccessibleName(productLink(30))
    expect(links[11]).toHaveAccessibleName(productLink(19))
    expect(links).toHaveLength(12)
    expect(screen.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('abrir a URL com ordenação seleciona a opção e mantém o sort na paginação', async () => {
    renderRoute('/?sort=price-desc')
    await screen.findByRole('link', { name: productLink(1) })

    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-desc')
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'href',
      '/?sort=price-desc&page=2',
    )
  })

  it('ordenação desconhecida na URL conta como padrão e não é enviada à API', async () => {
    const requested: URL[] = []
    server.use(productListHandler({ onRequest: (url) => requested.push(url) }))
    const { router } = renderRoute('/?sort=rating-desc')
    await screen.findByRole('link', { name: productLink(1) })

    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('')
    expect(requested.length).toBeGreaterThan(0)
    expect(requested.every((url) => !url.searchParams.has('sortBy'))).toBe(true)
    expect(router.state.location.search).toBe('?sort=rating-desc')
  })

  it('trocar a categoria e buscar mantêm a ordenação', async () => {
    const { router, user } = renderRoute('/?sort=price-asc')
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')
    expect(router.state.location.search).toBe('?category=smartphones&sort=price-asc')

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')
    expect(router.state.location.search).toBe('?q=Produto+1&sort=price-asc')
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-asc')
  })

  it('"Padrão" tira a ordenação da URL', async () => {
    const { router, user } = renderRoute('/?sort=price-asc&page=2')
    await screen.findByRole('link', { name: productLink(13) })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'Padrão')

    expect(router.state.location.search).toBe('')
  })

  it('navegar com o teclado no select de ordenação só navega ao confirmar com Enter', async () => {
    const { router } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })
    const select = screen.getByRole('combobox', { name: 'Ordenar por' })
    act(() => select.focus())

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.change(select, { target: { value: 'price-asc' } })

    expect(select).toHaveValue('price-asc')
    expect(router.state.location.search).toBe('')

    fireEvent.keyDown(select, { key: 'Enter' })

    expect(router.state.location.search).toBe('?sort=price-asc')
  })

  it('ordenação com página além do fim vai para a última página mantendo a ordenação', async () => {
    const { router } = renderRoute('/?sort=price-asc&page=99')

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price-asc&page=3'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('"Limpar busca" mantém a ordenação, no link e no clique', async () => {
    const { router, user } = renderRoute('/?q=Produto&sort=price-asc')
    await screen.findByRole('link', { name: productLink(1) })

    const clear = screen.getByRole('link', { name: 'Limpar busca' })
    expect(clear).toHaveAttribute('href', '/?sort=price-asc')
    await user.click(clear)

    expect(router.state.location.search).toBe('?sort=price-asc')
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-asc')
  })

  it('erro ao ordenar mantém a paginação conhecida de qualquer ordenação', async () => {
    const { user } = renderRoute('/')
    await screen.findByRole('link', { name: productLink(1) })
    server.use(
      http.get(`${API_URL}/products`, ({ request }) =>
        new URL(request.url).searchParams.has('sortBy')
          ? HttpResponse.json({ message: 'erro' }, { status: 500 })
          : undefined,
      ),
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'Menor preço')

    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'href',
      '/?sort=price-asc&page=2',
    )
  })

  it('trocar a categoria anuncia a lista nova para leitores de tela', async () => {
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    const announcement = await inPage().findByText('10 produtos em Smartphones.')
    expect(announcement).toHaveAttribute('role', 'status')
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveFocus()
  })

  it('trocar a ordenação anuncia a ordem nova para leitores de tela', async () => {
    const { user } = renderRoute('/?q=Produto+1')
    await screen.findByRole('link', { name: productLink(1) })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'Menor preço')

    expect(
      await inPage().findByText('11 produtos para “Produto 1”, do menor para o maior preço.'),
    ).toHaveAttribute('role', 'status')
  })

  it('voltar para uma lista já em cache anuncia na hora', async () => {
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    await user.selectOptions(select, 'Smartphones')
    await inPage().findByText('10 produtos em Smartphones.')

    await user.selectOptions(select, 'Todas')

    expect(inPage().getByText('30 produtos em todas as categorias.')).toHaveAttribute(
      'role',
      'status',
    )
  })

  it('o anúncio some ao sair da lista anunciada e a mesma lista é anunciada de novo', async () => {
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    const select = screen.getByRole('combobox', { name: 'Categoria' })
    await user.selectOptions(select, 'Smartphones')
    await inPage().findByText('10 produtos em Smartphones.')

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Resultados para “Produto 1”' })
    expect(inPage().queryByText(/produtos em/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Limpar busca' }))
    await screen.findByRole('heading', { level: 1, name: 'Produtos' })
    await user.selectOptions(select, 'Smartphones')

    expect(await inPage().findByText('10 produtos em Smartphones.')).toBeInTheDocument()
  })

  it('tentar de novo depois de um erro ao trocar a categoria não anuncia', async () => {
    let failures = 1
    server.use(
      http.get(`${API_URL}/products/category/smartphones`, () => {
        if (failures-- > 0) return HttpResponse.json({ message: 'erro' }, { status: 500 })
        return undefined
      }),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')
    await screen.findByText('Não foi possível carregar os produtos.')

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await screen.findByRole('link', { name: productLink(21) })
    expect(inPage().queryByText(/produtos em/)).not.toBeInTheDocument()
  })

  it('trocar para uma categoria sem produtos não anuncia', async () => {
    server.use(
      categoryProductsHandler({
        products: catalogProducts.filter((product) => product.category === 'beauty'),
      }),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    await screen.findByText('Nenhum produto encontrado.')
    expect(inPage().queryByText(/produtos? em/)).not.toBeInTheDocument()
  })

  it('anuncia no singular quando há um produto', async () => {
    server.use(
      categoryProductsHandler({ products: [makeProductDto({ id: 21, category: 'smartphones' })] }),
    )
    const { user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    expect(await inPage().findByText('1 produto em Smartphones.')).toBeInTheDocument()
  })

  it('escolha abandonada antes da lista chegar não anuncia depois', async () => {
    server.use(categoryProductsHandler({ delayMs: 100 }))
    const { router, user } = renderRoute('/')
    await screen.findByRole('option', { name: 'Smartphones' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Smartphones')

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Produto 1{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Resultados para “Produto 1”' })
    await act(() => router.navigate('/?category=smartphones'))

    await screen.findByRole('link', { name: productLink(21) })
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    expect(inPage().queryByText(/produtos em/)).not.toBeInTheDocument()
  })

  it('abrir a URL com categoria e ordenação não anuncia nada', async () => {
    renderRoute('/?category=smartphones&sort=price-asc')
    await screen.findByRole('link', { name: productLink(21) })

    expect(inPage().queryByText(/produtos em/)).not.toBeInTheDocument()
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
    expect(inPage().queryByText('Carregando produtos…')).not.toBeInTheDocument()
    expect(pageTwoRequests).toBe(1)
  })

  it('o link Voltar do detalhe leva de volta à mesma página do catálogo', async () => {
    const { router, user } = renderRoute('/?page=2')
    await user.click(await screen.findByRole('link', { name: productLink(13) }))

    await user.click(await screen.findByRole('link', { name: 'Voltar' }))

    expect(router.state.location.search).toBe('?page=2')
    expect(screen.getByRole('link', { name: productLink(13) })).toBeInTheDocument()
  })

  it('Voltar com a tecla de nova aba deixa o navegador agir e não troca a página atual', async () => {
    const { router, user } = renderRoute('/?page=2')
    await user.click(await screen.findByRole('link', { name: productLink(13) }))
    const back = await screen.findByRole('link', { name: 'Voltar' })
    let defaultPrevented: boolean | undefined
    const observeClick = (event: MouseEvent) => {
      defaultPrevented = event.defaultPrevented
      event.preventDefault()
    }
    document.addEventListener('click', observeClick)

    try {
      await user.keyboard('{Meta>}')
      await user.click(back)
      await user.keyboard('{/Meta}')
    } finally {
      document.removeEventListener('click', observeClick)
    }

    expect(defaultPrevented).toBe(false)
    expect(back).toHaveAttribute('href', '/')
    expect(router.state.location.pathname).toBe('/products/13')
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
