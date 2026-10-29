import { describe, expect, it } from 'vitest'
import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it('formata centavos como dólar em pt-BR', () => {
    expect(formatPrice(999)).toBe('US$ 9,99')
    expect(formatPrice(109999)).toBe('US$ 1.099,99')
    expect(formatPrice(0)).toBe('US$ 0,00')
  })
})
