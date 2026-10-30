# Vitrine (react-ecommerce)

Loja virtual de portfólio em React. Detalhes no `README.md`; design e plano em `tasks/` (fora do git).

## Ambiente

- Node 24.15 ou mais novo, fixado no `.nvmrc` (React Router 8, Vitest 5, jsdom 30 e MSW 3 exigem Node ≥ 22.22). Confira com `node -v` antes de rodar `npm`; com nvm, `nvm use` na raiz do projeto.

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm test` — testes (Vitest)
- `npm run lint` — oxlint
- `npm run format` / `npm run format:check` — Prettier
- `npm run build` — checagem de tipos + build

## Convenções

- Nunca coloque comentários no código.
- Código por funcionalidade em `src/features/<nome>`; o que é compartilhado fica em `src/shared`; rotas, layout e providers em `src/app`.
- Imports a partir de `src` usam o alias `@/`.
- Dinheiro sempre em centavos inteiros (`priceCents`, `subtotalCents`, `totalCents`); exibição só por `formatPrice`.
- Dados da API passam pelo Adapter (`features/catalog/api/productAdapter.ts`) antes de chegar aos componentes.
- Textos de interface em pt-BR; os dados dos produtos chegam em inglês da DummyJSON e não são traduzidos.
- Testes ficam ao lado do arquivo (`*.test.ts[x]`), importam de `vitest` (sem globals) e mockam a rede com MSW (`src/test/server.ts`); nenhum teste acessa a API real.
- Para testar uma tela inteira, use `renderRoute(path)` de `src/test/renderRoute.tsx`.
- As rotas do checkout carregam sob demanda (`lazy` em `src/app/routes.tsx`, na forma de função): num teste que abre `/checkout`, espere a página com `findBy…` antes de interagir.
