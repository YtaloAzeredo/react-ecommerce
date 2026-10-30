// Sem juros: a parcela é arredondada para cima, para a soma nunca ficar abaixo do total.
export function getInstallmentOptions(
  totalCents: number,
): Array<{ count: number; amountCents: number }> {
  return Array.from({ length: 12 }, (_, index) => ({
    count: index + 1,
    amountCents: Math.ceil(totalCents / (index + 1)),
  }))
}
