import type { ReactNode } from 'react'

// Providers compartilhados entre o app e os testes; as próximas partes acrescentam os de cache e carrinho.
export function AppProviders({ children }: { children: ReactNode }) {
  return children
}
