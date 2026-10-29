import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/server'
import { API_URL, HttpError, httpGet } from './http'

describe('httpGet', () => {
  it('monta a URL com os parâmetros e ignora os indefinidos', async () => {
    let requestedUrl: URL | undefined
    server.use(
      mswHttp.get(`${API_URL}/products`, ({ request }) => {
        requestedUrl = new URL(request.url)
        return HttpResponse.json({ ok: true })
      }),
    )

    const body = await httpGet<{ ok: boolean }>('/products', {
      params: { limit: 12, skip: 0, q: undefined },
    })

    expect(body).toEqual({ ok: true })
    expect(requestedUrl?.searchParams.get('limit')).toBe('12')
    expect(requestedUrl?.searchParams.get('skip')).toBe('0')
    expect(requestedUrl?.searchParams.has('q')).toBe(false)
  })

  it('lança HttpError com o status quando a resposta não é ok', async () => {
    server.use(
      mswHttp.get(`${API_URL}/products/99999`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )

    const error = await httpGet('/products/99999').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as HttpError).status).toBe(404)
  })
})
