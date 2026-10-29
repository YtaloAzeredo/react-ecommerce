import { setupServer } from 'msw/node'

// Sem handlers padrão: cada teste declara com server.use() as respostas de que precisa.
export const server = setupServer()
