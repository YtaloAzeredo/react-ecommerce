import type { ProductSort } from './types'

export const sortLabels: Record<ProductSort, { option: string; description: string }> = {
  'price-asc': { option: 'Menor preço', description: 'do menor para o maior preço' },
  'price-desc': { option: 'Maior preço', description: 'do maior para o menor preço' },
  'title-asc': { option: 'Nome (A–Z)', description: 'em ordem alfabética' },
}
