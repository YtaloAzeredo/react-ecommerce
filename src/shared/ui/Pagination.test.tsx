import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
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

  it('Anterior fica indisponível na primeira página', () => {
    renderPagination(1, 5)

    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Próxima' })).not.toHaveAttribute('aria-disabled')
  })

  it('Próxima fica indisponível na última página', () => {
    renderPagination(5, 5)

    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Anterior' })).not.toHaveAttribute('aria-disabled')
  })

  it('clicar num passo indisponível não navega', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <Pagination page={5} totalPages={5} getHref={(target) => `/?page=${target}`}>
              <Pagination.Next />
            </Pagination>
          ),
        },
      ],
      { initialEntries: ['/?page=5'] },
    )
    render(<RouterProvider router={router} />)

    await userEvent.setup().click(screen.getByRole('link', { name: 'Próxima' }))

    expect(router.state.historyAction).toBe('POP')
    expect(router.state.location.search).toBe('?page=5')
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
