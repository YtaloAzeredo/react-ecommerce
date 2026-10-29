import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { catalogHandlers } from '@/test/catalogHandlers'
import { renderRoute } from '@/test/renderRoute'
import { server } from '@/test/server'

describe('rotas', () => {
  beforeEach(() => {
    server.use(...catalogHandlers())
  })

  it('mostra o cabeçalho com o link da loja', () => {
    renderRoute('/')

    expect(screen.getByRole('link', { name: 'Vitrine' })).toHaveAttribute('href', '/')
  })

  it('rota desconhecida mostra a página 404', () => {
    renderRoute('/nao-existe')

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a loja' })).toHaveAttribute('href', '/')
  })
})
