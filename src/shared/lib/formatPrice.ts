// A DummyJSON fala em dólar; mostramos dólar no formato brasileiro em vez de inventar uma conversão.
const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100)
}
