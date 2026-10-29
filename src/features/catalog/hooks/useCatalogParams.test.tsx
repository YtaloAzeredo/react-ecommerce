import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { parsePage, useCatalogParams } from './useCatalogParams'

function renderAt(path: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  )
  return renderHook(() => useCatalogParams(), { wrapper }).result.current
}

describe('parsePage', () => {
  it('só aceita inteiros a partir de 1', () => {
    for (const raw of ['abc', '0', '-3', '2.5', '', null]) expect(parsePage(raw)).toBe(1)
    expect(parsePage('7')).toBe(7)
  })
})

describe('useCatalogParams', () => {
  it('lê página e categoria da URL', () => {
    expect(renderAt('/?category=beauty&page=2')).toMatchObject({ page: 2, category: 'beauty' })
    expect(renderAt('/')).toMatchObject({ page: 1, category: null })
  })

  it('página 1 não aparece na URL', () => {
    expect(renderAt('/?page=3').hrefFor({ page: 1 })).toBe('/')
  })

  it('trocar de categoria volta para a página 1', () => {
    expect(renderAt('/?page=3').hrefFor({ category: 'beauty' })).toBe('/?category=beauty')
  })

  it('mudar de página mantém a categoria', () => {
    expect(renderAt('/?category=beauty').hrefFor({ page: 2 })).toBe('/?category=beauty&page=2')
  })

  it('categoria null tira o filtro', () => {
    expect(renderAt('/?category=beauty&page=2').hrefFor({ category: null })).toBe('/')
  })
})
