import { describe, expect, it } from 'vitest'
import { getPageItems } from './getPageItems'

describe('getPageItems', () => {
  it('mostra todas as páginas quando cabem em 7 posições', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('perto do início, mostra as 5 primeiras e a última', () => {
    expect(getPageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10])
  })

  it('no meio, mostra a atual com uma vizinha de cada lado', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })

  it('perto do fim, mostra a primeira e as 5 últimas', () => {
    expect(getPageItems(7, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10])
    expect(getPageItems(17, 17)).toEqual([1, 'ellipsis', 13, 14, 15, 16, 17])
  })
})
