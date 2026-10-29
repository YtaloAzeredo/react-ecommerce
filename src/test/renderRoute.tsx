import type { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { routes } from '@/app/routes'
import { createTestQueryClient } from './queryClient'

// Renderiza o app inteiro numa rota, com os mesmos providers do app de verdade.
export function renderRoute(path: string, options: { queryClient?: QueryClient } = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...result, router, user, queryClient }
}
