import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

configure({ reactStrictMode: true })

window.scrollTo = () => {}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => server.close())
