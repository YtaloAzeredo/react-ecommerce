import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppProviders } from './AppProviders'
import { createQueryClient } from './queryClient'
import { routes } from './routes'

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

export function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
