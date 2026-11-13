import { onlyDigits } from './masks'

export const FREE_SHIPPING_FROM_CENTS = 30000

export interface ShippingQuote {
  costCents: number
  deliveryDays: number
}

const zones: Record<string, ShippingQuote> = {
  '0': { costCents: 990, deliveryDays: 3 },
  '1': { costCents: 990, deliveryDays: 3 },
  '2': { costCents: 990, deliveryDays: 3 },
  '3': { costCents: 990, deliveryDays: 3 },
  '8': { costCents: 990, deliveryDays: 3 },
  '9': { costCents: 990, deliveryDays: 3 },
  '4': { costCents: 1990, deliveryDays: 6 },
  '5': { costCents: 1990, deliveryDays: 6 },
  '7': { costCents: 1990, deliveryDays: 6 },
  '6': { costCents: 2990, deliveryDays: 10 },
}

export function quoteShipping(cep: string, subtotalCents: number): ShippingQuote | null {
  const digits = onlyDigits(cep)
  if (digits.length !== 8) return null
  const zone = zones[digits[0]]
  return subtotalCents >= FREE_SHIPPING_FROM_CENTS ? { ...zone, costCents: 0 } : zone
}
