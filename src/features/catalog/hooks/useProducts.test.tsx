import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  categoryProductsHandler,
  productListHandler,
  searchProductsHandler,
} from '@/test/catalogHandlers'
import { createTestQueryClient } from '@/test/queryClient'
import { queryWrapper } from '@/test/queryWrapper'
import { server } from '@/test/server'
import type { ProductListParams } from '../model/types'
import { productKeys } from '../queries'
import { useProducts } from './useProducts'

describe('useProducts', () => {
  it('mantém a página anterior enquanto a próxima carrega', async () => {
    server.use(productListHandler())
    const { result, rerender } = renderHook((params: ProductListParams) => useProducts(params), {
      initialProps: { page: 1, category: null, search: null },
      wrapper: queryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 3, category: null, search: null })

    expect(result.current.data?.page).toBe(1)
    expect(result.current.isPlaceholderData).toBe(true)
    await waitFor(() => expect(result.current.data?.page).toBe(3))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('trocar de categoria não reaproveita a lista da categoria anterior', async () => {
    server.use(productListHandler(), categoryProductsHandler({ delayMs: 50 }))
    const { result, rerender } = renderHook((params: ProductListParams) => useProducts(params), {
      initialProps: { page: 1, category: null, search: null } as ProductListParams,
      wrapper: queryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 1, category: 'smartphones', search: null })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.data?.items[0]?.category).toBe('smartphones'))
  })

  it('trocar o termo de busca não reaproveita a lista anterior', async () => {
    server.use(productListHandler(), searchProductsHandler({ delayMs: 50 }))
    const { result, rerender } = renderHook((params: ProductListParams) => useProducts(params), {
      initialProps: { page: 1, category: null, search: null } as ProductListParams,
      wrapper: queryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 1, category: null, search: 'Produto 1' })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.data?.total).toBe(11))
  })

  it('pré-busca a próxima página da mesma busca', async () => {
    server.use(searchProductsHandler())
    const queryClient = createTestQueryClient()

    const { result } = renderHook(
      () => useProducts({ page: 1, category: null, search: 'Produto' }),
      { wrapper: queryWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() =>
      expect(
        queryClient.getQueryData(productKeys.list({ page: 2, category: null, search: 'Produto' })),
      ).toBeDefined(),
    )
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
    const wrapper = queryWrapper(createTestQueryClient())
    const params: ProductListParams = { page: 1, category: null, search: null }

    const first = renderHook(() => useProducts(params), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    const second = renderHook(() => useProducts(params), { wrapper })

    expect(second.result.current.isSuccess).toBe(true)
    expect(second.result.current.data?.items).toHaveLength(12)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(firstPageRequests).toBe(1)
  })

  it('pré-busca a próxima página', async () => {
    server.use(productListHandler())
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useProducts({ page: 1, category: null, search: null }), {
      wrapper: queryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() =>
      expect(
        queryClient.getQueryData(productKeys.list({ page: 2, category: null, search: null })),
      ).toBeDefined(),
    )
  })

  it('não pré-busca depois da última página', async () => {
    const requestedSkips: string[] = []
    server.use(
      productListHandler({
        onRequest: (url) => requestedSkips.push(url.searchParams.get('skip')!),
      }),
    )

    const { result } = renderHook(() => useProducts({ page: 3, category: null, search: null }), {
      wrapper: queryWrapper(createTestQueryClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requestedSkips).toEqual(['24'])
  })
})
