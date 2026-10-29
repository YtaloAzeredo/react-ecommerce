# Vitrine

Loja virtual de mentira, feita em React para portfólio. Ninguém compra nada de verdade: os produtos vêm de uma API pública de testes e o pedido final é simulado.

## Para que serve

O projeto existe para mostrar, em código e funcionando, quatro coisas comuns em front-end de mercado:

- **Paginação** feita pelo servidor, com a página e o filtro na URL (dá para atualizar ou compartilhar o link sem perder onde estava).
- **Estado de formulário** num checkout com validação por campo, máscaras, campos que mudam conforme a forma de pagamento, envio assíncrono com tratamento de erro e rascunho preservado.
- **Cache de telas:** sair da página 3 do catálogo, abrir um produto e voltar faz a lista aparecer na hora, na mesma página e na mesma posição de rolagem, sem carregar de novo.
- **Padrões de projeto** usados no dia a dia, aplicados onde fazem sentido.

## Como funciona

### Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- [React Router](https://reactrouter.com) para as rotas
- [TanStack Query](https://tanstack.com/query) para buscar e guardar em cache os dados da API
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) para o formulário e as regras de validação
- [Tailwind CSS](https://tailwindcss.com) para o visual
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) + [MSW](https://mswjs.io) para os testes
- [DummyJSON](https://dummyjson.com) como fonte dos produtos

### Padrões de projeto

| Padrão                                           | Onde aparece                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Hooks próprios                                   | `useProducts`, `useProduct`, `useCatalogParams`, `useCart`                       |
| Estado do servidor separado do estado do cliente | TanStack Query para a API; Context + reducer para o carrinho                     |
| Organização por funcionalidade                   | `src/features/catalog`, `cart`, `checkout`                                       |
| Camada de API com Adapter                        | a resposta da DummyJSON é convertida para os tipos do app num único lugar        |
| Provider                                         | carrinho e cache disponíveis para o app inteiro                                  |
| Reducer                                          | todas as regras do carrinho numa função pura                                     |
| Compound components                              | `Pagination` com `Pagination.Previous`, `Pagination.Items` e `Pagination.Next`   |
| Strategy                                         | formas de pagamento, cada uma com seus campos, valores padrão e cálculo do total |

### Telas

`/` catálogo (`?page=N&category=slug`) → `/products/:id` detalhe → `/cart` carrinho → `/checkout` formulário → `/checkout/success` confirmação. Qualquer outro endereço mostra uma página 404.

### Organização das pastas

```
src/
├── app/         # rotas, layout e providers
├── shared/      # código usado por mais de uma funcionalidade (HTTP, formatação, componentes)
├── features/    # uma pasta por funcionalidade: catalog, cart, checkout
└── test/        # configuração e utilitários dos testes
```

## Como rodar

### Requisitos

- **Node 24.15 ou mais novo.** A versão está fixada no `.nvmrc`; com o [nvm](https://github.com/nvm-sh/nvm), basta `nvm use` na pasta do projeto.
- npm (vem com o Node).

### Instalação

```bash
nvm use
npm install
cp .env.example .env
```

O `.env` só tem o endereço da API (`VITE_API_URL`). Sem ele, o app usa `https://dummyjson.com`.

### Comandos

| Comando              | O que faz                                             |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | sobe o app em modo de desenvolvimento                 |
| `npm test`           | roda os testes uma vez                                |
| `npm run test:watch` | roda os testes a cada mudança                         |
| `npm run lint`       | verifica o código com o oxlint                        |
| `npm run format`     | formata o código com o Prettier                       |
| `npm run build`      | checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview`    | serve a versão de produção localmente                 |

## Status

O projeto está sendo construído em partes:

- [x] **Parte 1 — Base do projeto:** ferramentas, rotas, layout e página 404
- [ ] **Parte 2 — Catálogo paginado**
- [ ] **Parte 3 — Detalhe do produto e cache de telas**
- [ ] **Parte 4 — Carrinho**
- [ ] **Parte 5 — Checkout**
