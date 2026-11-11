import type { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, parsePath, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { routes } from '@/app/routes'
import { createTestQueryClient } from './queryClient'

export function renderRoute(
  path: string,
  options: { queryClient?: QueryClient; state?: unknown; strictMode?: boolean } = {},
) {
  const { strictMode = true } = options
  const queryClient = options.queryClient ?? createTestQueryClient()
  const router = createMemoryRouter(routes, {
    initialEntries: [{ ...parsePath(path), state: options.state }],
  })
  const user = userEvent.setup()
  const app = (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )
  const result = render(app, { reactStrictMode: strictMode })
  return { ...result, router, user, queryClient }
}
