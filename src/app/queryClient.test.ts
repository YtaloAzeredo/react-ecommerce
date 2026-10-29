import { describe, expect, it } from 'vitest'
import { HttpError } from '@/shared/api/http'
import { createQueryClient } from './queryClient'

describe('createQueryClient', () => {
  it('não repete 404 e repete outros erros uma vez', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean

    expect(retry(0, new HttpError(404))).toBe(false)
    expect(retry(0, new Error('rede'))).toBe(true)
    expect(retry(1, new Error('rede'))).toBe(false)
  })
})
