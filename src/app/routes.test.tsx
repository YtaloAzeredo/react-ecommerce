import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { catalogHandlers } from '@/test/catalogHandlers'
import { makeCartItem, seedCart } from '@/test/fixtures'
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

  describe.each([
    { mode: 'como em produção (efeitos uma vez)', strictMode: false },
    { mode: 'como em desenvolvimento (StrictMode)', strictMode: true },
  ])('foco na troca de rota, $mode', ({ strictMode }) => {
    it('abrir o app não move o foco', async () => {
      renderRoute('/', { strictMode })
      await screen.findByRole('heading', { level: 1, name: 'Produtos' })

      expect(screen.getByRole('main')).not.toHaveFocus()
    })

    it('trocar de página leva o foco para o conteúdo principal', async () => {
      seedCart([makeCartItem()])
      const { user } = renderRoute('/', { strictMode })
      await screen.findByRole('heading', { level: 1, name: 'Produtos' })

      await user.click(screen.getByRole('link', { name: 'Carrinho (1 item)' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'Carrinho' })).toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveFocus()
    })
  })
})
