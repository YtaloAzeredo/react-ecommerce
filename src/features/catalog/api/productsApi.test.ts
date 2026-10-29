import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL, HttpError } from '@/shared/api/http'
import { makeProductDto, makeProductListDto } from '@/test/fixtures'
import { server } from '@/test/server'
import { fetchCategories, fetchProduct, fetchProducts } from './productsApi'

describe('fetchProducts', () => {
  it('busca a página 3 com limit 12 e skip 24', async () => {
    let requestedUrl: URL | undefined
    server.use(
      http.get(`${API_URL}/products`, ({ request }) => {
        requestedUrl = new URL(request.url)
        return HttpResponse.json(makeProductListDto([makeProductDto({ id: 25 })], 194))
      }),
    )

    const page = await fetchProducts({ page: 3, category: null })

    expect(requestedUrl?.searchParams.get('limit')).toBe('12')
    expect(requestedUrl?.searchParams.get('skip')).toBe('24')
    expect(page).toMatchObject({ page: 3, pageSize: 12, total: 194, totalPages: 17 })
    expect(page.items[0].title).toBe('Produto 25')
  })

  it('usa a rota da categoria quando há categoria', async () => {
    let requestedSlug: string | undefined
    server.use(
      http.get(`${API_URL}/products/category/:slug`, ({ params }) => {
        requestedSlug = params.slug as string
        return HttpResponse.json(makeProductListDto([]))
      }),
    )

    await fetchProducts({ page: 1, category: 'smartphones' })

    expect(requestedSlug).toBe('smartphones')
  })
})

describe('fetchProduct', () => {
  it('converte o produto pelo Adapter', async () => {
    server.use(
      http.get(`${API_URL}/products/5`, () =>
        HttpResponse.json(makeProductDto({ id: 5, price: 19.99 })),
      ),
    )

    await expect(fetchProduct(5)).resolves.toMatchObject({ id: 5, priceCents: 1999 })
  })

  it('propaga 404 como HttpError', async () => {
    server.use(
      http.get(`${API_URL}/products/99999`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )

    await expect(fetchProduct(99999)).rejects.toMatchObject({
      constructor: HttpError,
      status: 404,
    })
  })
})

describe('fetchCategories', () => {
  it('devolve slug e nome', async () => {
    server.use(
      http.get(`${API_URL}/products/categories`, () =>
        HttpResponse.json([
          { slug: 'beauty', name: 'Beauty', url: `${API_URL}/products/category/beauty` },
        ]),
      ),
    )

    await expect(fetchCategories()).resolves.toEqual([{ slug: 'beauty', name: 'Beauty' }])
  })
})
