import { describe, expect, it } from 'vitest'
import { makeProductDto, makeProductListDto } from '@/test/fixtures'
import { toCategory, toProduct, toProductPage } from './productAdapter'

describe('toProduct', () => {
  it('converte o preço para centavos sem erro de ponto flutuante', () => {
    expect(toProduct(makeProductDto({ price: 9.99 })).priceCents).toBe(999)
    expect(toProduct(makeProductDto({ price: 1099.99 })).priceCents).toBe(109999)
    expect(toProduct(makeProductDto({ price: 0.29 })).priceCents).toBe(29)
  })

  it('marca ausente vira null', () => {
    expect(toProduct(makeProductDto({ brand: undefined })).brand).toBeNull()
  })

  it('renomeia thumbnail e images', () => {
    const product = toProduct(
      makeProductDto({ thumbnail: 'https://cdn/t.webp', images: ['https://cdn/1.webp'] }),
    )

    expect(product.thumbnailUrl).toBe('https://cdn/t.webp')
    expect(product.imageUrls).toEqual(['https://cdn/1.webp'])
  })
})

describe('toProductPage', () => {
  it('calcula o total de páginas', () => {
    const page = toProductPage(makeProductListDto([makeProductDto()], 194), 3, 12)

    expect(page).toMatchObject({ page: 3, pageSize: 12, total: 194, totalPages: 17 })
    expect(page.items).toHaveLength(1)
    expect(toProductPage(makeProductListDto([], 0), 1, 12).totalPages).toBe(1)
  })
})

describe('toCategory', () => {
  it('mantém só slug e nome', () => {
    expect(toCategory({ slug: 'beauty', name: 'Beauty', url: 'https://dummyjson.com/x' })).toEqual({
      slug: 'beauty',
      name: 'Beauty',
    })
  })
})
