import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'

describe('rotas', () => {
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
