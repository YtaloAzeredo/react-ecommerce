import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { categoryProductsHandler, productListHandler } from '@/test/catalogHandlers'
import { createTestQueryClient } from '@/test/queryClient'
import { server } from '@/test/server'
import type { ProductListParams } from '../queries'
import { useProducts } from './useProducts'

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProducts', () => {
  it('mantém a página anterior enquanto a próxima carrega', async () => {
    server.use(productListHandler())
    const { result, rerender } = renderHook((params: ProductListParams) => useProducts(params), {
      initialProps: { page: 1, category: null },
      wrapper: wrapperFor(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 2, category: null })

    expect(result.current.data?.page).toBe(1)
    expect(result.current.isPlaceholderData).toBe(true)
    await waitFor(() => expect(result.current.data?.page).toBe(2))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('trocar de categoria não reaproveita a lista da categoria anterior', async () => {
    server.use(productListHandler(), categoryProductsHandler({ delayMs: 50 }))
    const { result, rerender } = renderHook((params: ProductListParams) => useProducts(params), {
      initialProps: { page: 1, category: null } as ProductListParams,
      wrapper: wrapperFor(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 1, category: 'smartphones' })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.data?.items[0]?.category).toBe('smartphones'))
  })

  it('remontar com os mesmos parâmetros usa o cache sem nova requisição', async () => {
    let firstPageRequests = 0
    server.use(
      productListHandler({
        onRequest: (url) => {
          if (url.searchParams.get('skip') === '0') firstPageRequests++
        },
      }),
    )
    const wrapper = wrapperFor(createTestQueryClient())
    const params: ProductListParams = { page: 1, category: null }

    const first = renderHook(() => useProducts(params), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    const second = renderHook(() => useProducts(params), { wrapper })

    expect(second.result.current.isSuccess).toBe(true)
    expect(second.result.current.data?.items).toHaveLength(12)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(firstPageRequests).toBe(1)
  })
})
