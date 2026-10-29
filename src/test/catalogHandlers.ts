import { delay, http, HttpResponse } from 'msw'
import type { CategoryDto, ProductDto } from '@/features/catalog/api/dto'
import { API_URL } from '@/shared/api/http'
import { makeProductDto } from './fixtures'

// 30 produtos: com 12 por página, o catálogo tem 3 páginas (12, 12 e 6).
// Os 20 primeiros são da categoria beauty e os 10 últimos de smartphones.
export const catalogProducts: ProductDto[] = Array.from({ length: 30 }, (_, index) =>
  makeProductDto({ id: index + 1, category: index < 20 ? 'beauty' : 'smartphones' }),
)

export const catalogCategories: CategoryDto[] = [
  { slug: 'beauty', name: 'Beauty', url: `${API_URL}/products/category/beauty` },
  { slug: 'smartphones', name: 'Smartphones', url: `${API_URL}/products/category/smartphones` },
]

type ListOptions = {
  products?: ProductDto[]
  onRequest?: (url: URL) => void
  // Atraso da resposta, para o teste conseguir observar a tela enquanto a busca está em andamento.
  delayMs?: number
}

// Responde como a DummyJSON: fatia a lista por skip/limit e devolve o total.
function paginate(products: ProductDto[], url: URL) {
  const limit = Number(url.searchParams.get('limit') ?? products.length)
  const skip = Number(url.searchParams.get('skip') ?? 0)
  return HttpResponse.json({
    products: products.slice(skip, skip + limit),
    total: products.length,
    skip,
    limit,
  })
}

export function productListHandler(options: ListOptions = {}) {
  const products = options.products ?? catalogProducts
  return http.get(`${API_URL}/products`, async ({ request }) => {
    const url = new URL(request.url)
    options.onRequest?.(url)
    if (options.delayMs) await delay(options.delayMs)
    return paginate(products, url)
  })
}

export function categoryProductsHandler(options: ListOptions = {}) {
  const products = options.products ?? catalogProducts
  return http.get(`${API_URL}/products/category/:slug`, async ({ request, params }) => {
    const url = new URL(request.url)
    options.onRequest?.(url)
    if (options.delayMs) await delay(options.delayMs)
    return paginate(
      products.filter((product) => product.category === params.slug),
      url,
    )
  })
}

export function categoriesHandler() {
  return http.get(`${API_URL}/products/categories`, () => HttpResponse.json(catalogCategories))
}

export function productDetailHandler(options: { products?: ProductDto[]; delayMs?: number } = {}) {
  const products = options.products ?? catalogProducts
  return http.get(`${API_URL}/products/:id`, async ({ params }) => {
    // /products/categories também casa com este caminho; sem retorno, o MSW passa para o próximo handler.
    if (!/^\d+$/.test(String(params.id))) return
    if (options.delayMs) await delay(options.delayMs)
    const product = products.find((item) => item.id === Number(params.id))
    return product
      ? HttpResponse.json(product)
      : HttpResponse.json({ message: 'not found' }, { status: 404 })
  })
}

// Tudo que as telas do catálogo e do detalhe buscam.
export function catalogHandlers() {
  return [
    productListHandler(),
    categoryProductsHandler(),
    categoriesHandler(),
    productDetailHandler(),
  ]
}
