export interface InstallmentOption {
  count: number
  amountCents: number
  firstAmountCents: number
}

export function getInstallmentOptions(totalCents: number): InstallmentOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const count = index + 1
    const amountCents = Math.floor(totalCents / count)
    return { count, amountCents, firstAmountCents: totalCents - amountCents * (count - 1) }
  })
}
