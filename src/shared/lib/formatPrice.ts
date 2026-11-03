const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100)
}
