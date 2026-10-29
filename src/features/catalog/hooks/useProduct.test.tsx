import { renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { createQueryClient } from '@/app/queryClient'
import { API_URL } from '@/shared/api/http'
import { makeProductDto, makeProductListDto } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/queryClient'
import { queryWrapper } from '@/test/queryWrapper'
import { server } from '@/test/server'
import { toProductPage } from '../api/productAdapter'
import { productKeys } from '../queries'
import { useProduct } from './useProduct'

function respondWithProduct(title: string) {
  server.use(
    http.get(`${API_URL}/products/5`, async () => {
      await delay(50)
      return HttpResponse.json(makeProductDto({ id: 5, title }))
    }),
  )
}

describe('useProduct', () => {
  it('usa o produto da lista como dado provisório', async () => {
    respondWithProduct('Completo')
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      productKeys.list({ page: 1, category: null }),
      toProductPage(makeProductListDto([makeProductDto({ id: 5, title: 'Da lista' })]), 1, 12),
    )

    const { result } = renderHook(() => useProduct(5), { wrapper: queryWrapper(queryClient) })

    expect(result.current.data?.title).toBe('Da lista')
    expect(result.current.isPlaceholderData).toBe(true)
    await waitFor(() => expect(result.current.data?.title).toBe('Completo'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('sem o produto em nenhuma lista, começa carregando', () => {
    respondWithProduct('Completo')

    const { result } = renderHook(() => useProduct(5), {
      wrapper: queryWrapper(createTestQueryClient()),
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
  })

  it('404 não é repetido', async () => {
    let requests = 0
    server.use(
      http.get(`${API_URL}/products/99999`, () => {
        requests++
        return HttpResponse.json({ message: 'not found' }, { status: 404 })
      }),
    )

    // Cliente real: é a política de novas tentativas do app que está em teste.
    const { result } = renderHook(() => useProduct(99999), {
      wrapper: queryWrapper(createQueryClient()),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(requests).toBe(1)
  })
})
