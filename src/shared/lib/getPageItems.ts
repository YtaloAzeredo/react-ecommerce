export type PageItem = number | 'ellipsis'

// Sempre no máximo 7 posições, para a paginação não mudar de largura ao navegar:
// primeira, última, a atual com uma vizinha de cada lado e reticências onde houver salto.
const MAX_ITEMS = 7

export function getPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_ITEMS) return range(1, totalPages)
  if (current <= 4) return [...range(1, 5), 'ellipsis', totalPages]
  if (current >= totalPages - 3) return [1, 'ellipsis', ...range(totalPages - 4, totalPages)]
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages]
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
