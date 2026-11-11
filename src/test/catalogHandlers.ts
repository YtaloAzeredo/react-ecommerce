import { delay, http, HttpResponse } from 'msw'
import type { CategoryDto, ProductDto } from '@/features/catalog/api/dto'
import { API_URL } from '@/shared/api/http'
import { makeProductDto } from './fixtures'

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
  delayMs?: number
}

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

export function searchProductsHandler(options: ListOptions = {}) {
  const products = options.products ?? catalogProducts
  return http.get(`${API_URL}/products/search`, async ({ request }) => {
    const url = new URL(request.url)
    options.onRequest?.(url)
    if (options.delayMs) await delay(options.delayMs)
    const term = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    return paginate(
      products.filter(
        (product) =>
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term),
      ),
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
    if (!/^\d+$/.test(String(params.id))) return
    if (options.delayMs) await delay(options.delayMs)
    const product = products.find((item) => item.id === Number(params.id))
    return product
      ? HttpResponse.json(product)
      : HttpResponse.json({ message: 'not found' }, { status: 404 })
  })
}

export function catalogHandlers() {
  return [
    productListHandler(),
    categoryProductsHandler(),
    searchProductsHandler(),
    categoriesHandler(),
    productDetailHandler(),
  ]
}
