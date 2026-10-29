import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

function renderPagination(page: number, totalPages: number) {
  return render(
    <MemoryRouter>
      <Pagination page={page} totalPages={totalPages} getHref={(target) => `/?page=${target}`}>
        <Pagination.Previous />
        <Pagination.Items />
        <Pagination.Next />
      </Pagination>
    </MemoryRouter>,
  )
}

describe('Pagination', () => {
  it('marca a página atual com aria-current', () => {
    renderPagination(3, 17)

    expect(screen.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Página 4' })).not.toHaveAttribute('aria-current')
  })

  it('links usam getHref', () => {
    renderPagination(3, 17)

    expect(screen.getByRole('link', { name: 'Página 4' })).toHaveAttribute('href', '/?page=4')
    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('href', '/?page=2')
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute('href', '/?page=4')
  })

  it('Anterior fica desabilitado na primeira página', () => {
    renderPagination(1, 5)

    expect(screen.queryByRole('link', { name: 'Anterior' })).not.toBeInTheDocument()
    expect(screen.getByText('Anterior')).toHaveAttribute('aria-disabled', 'true')
  })

  it('Próxima fica desabilitado na última página', () => {
    renderPagination(5, 5)

    expect(screen.queryByRole('link', { name: 'Próxima' })).not.toBeInTheDocument()
    expect(screen.getByText('Próxima')).toHaveAttribute('aria-disabled', 'true')
  })

  it('esconde as reticências de leitores de tela', () => {
    renderPagination(5, 10)

    const ellipses = screen.getAllByText('…')
    expect(ellipses).toHaveLength(2)
    for (const ellipsis of ellipses) expect(ellipsis).toHaveAttribute('aria-hidden', 'true')
  })

  it('não renderiza nada com uma página só', () => {
    const { container } = renderPagination(1, 1)

    expect(container).toBeEmptyDOMElement()
  })

  it('subcomponente fora de <Pagination> lança erro', () => {
    // O React registra o erro de renderização no console; aqui ele é esperado.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(
        <MemoryRouter>
          <Pagination.Next />
        </MemoryRouter>,
      ),
    ).toThrow('Pagination.* precisa estar dentro de <Pagination>')
  })
})
