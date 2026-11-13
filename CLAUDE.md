# Vitrine (react-ecommerce)

Loja virtual de estudos em React. Detalhes no `README.md`; design e plano em `tasks/` (fora do git).

## Ambiente

- Node 24, a partir da 24.15, fixado no `.nvmrc` e no `engines` do `package.json` (React Router 8, Vitest 5, jsdom 30 e MSW 3 exigem Node ≥ 22.22). Mudar a versão do Node é mudar os três juntos: `.nvmrc` (local e CI), `engines` (a Vercel usa este) e o lockfile. Confira com `node -v` antes de rodar `npm`; com nvm, `nvm use` na raiz do projeto.

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm test` — testes (Vitest)
- `npm run lint` — oxlint
- `npm run format` / `npm run format:check` — Prettier
- `npm run build` — checagem de tipos + build
- Deploy: Vercel, conectada ao GitHub (push na `main` publica; outras branches geram prévia); `vercel.json` manda toda rota para o `index.html`.
- CI: `.github/workflows/ci.yml` roda `format:check`, `lint`, `test` e `build` a cada push; os quatro precisam passar antes de dar uma tarefa por terminada.

## Convenções

- Nunca coloque comentários no código.
- Código por funcionalidade em `src/features/<nome>`; o que é compartilhado fica em `src/shared`; rotas, layout e providers em `src/app`.
- Imports a partir de `src` usam o alias `@/`.
- Dinheiro sempre em centavos inteiros (`priceCents`, `subtotalCents`, `totalCents`); exibição só por `formatPrice`.
- Dados da API passam pelo Adapter (`features/catalog/api/productAdapter.ts`) antes de chegar aos componentes.
- Textos de interface em pt-BR; os dados dos produtos chegam em inglês da DummyJSON e não são traduzidos.
- Testes ficam ao lado do arquivo (`*.test.ts[x]`), importam de `vitest` (sem globals) e mockam a rede com MSW (`src/test/server.ts`); nenhum teste acessa a API real.
- Todo `render`/`renderHook` dos testes roda em `<StrictMode>` (`configure({ reactStrictMode: true })` em `src/test/setup.ts`), como o `src/main.tsx` (em desenvolvimento os efeitos rodam duas vezes na montagem; em produção, uma). Para testar uma tela inteira, use `renderRoute(path)` de `src/test/renderRoute.tsx`; `strictMode: false` reproduz a montagem única num teste específico. Conte requisições no handler do MSW e, antes de contar, espere uma volta do event loop com `await act(() => new Promise((resolve) => setTimeout(resolve, 0)))`: logo após o `render` o handler ainda não rodou (nem `await Promise.resolve()` basta), e no StrictMode a primeira busca de cada query é abortada e o MSW não chama o handler para ela. Ao chamar `configure` do Testing Library num teste, repita `reactStrictMode: true`, porque a chamada parcial apaga a opção.
- As rotas do checkout carregam sob demanda (`lazy` em `src/app/routes.tsx`, na forma de função): num teste que abre `/checkout`, espere a página com `findBy…` antes de interagir.
