import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// O jsdom não implementa rolagem; o ScrollRestoration do React Router chama scrollTo.
window.scrollTo = () => {}

// No MSW 3 a opção se chama onUnhandledFrame (era onUnhandledRequest); com o nome antigo ela é ignorada.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => server.close())
