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

### Decisões técnicas

Escolhas que não dá para ver só lendo o código:

- **A página anterior só fica na tela se for da mesma categoria.** Ao trocar de página, a lista anterior continua visível enquanto a nova carrega. Ao trocar de categoria isso não acontece: mostrar produtos de outra categoria sob o título novo seria pior que o "Carregando" (`useProducts`).
- **O carrinho fica igual em todas as abas.** Cada aba guarda o carrinho em memória e regrava o `localStorage` a cada mudança; sem ouvir o evento `storage`, uma aba aberta antes apagaria o que a outra adicionou (`CartProvider`).
- **Apagar o campo de quantidade não remove o item.** O texto em edição fica só no campo e só um inteiro a partir de 1 chega ao carrinho; para remover existe o botão "Remover" (`CartLineItem`).
- **As máscaras mantêm o cursor no lugar.** Reescrever o valor do campo manda o cursor para o fim; quem corrigisse um dígito no meio do telefone digitaria o próximo no fim e gravaria outro número válido. Depois de aplicar a máscara, o cursor volta para depois do mesmo número de dígitos (`FormField`).
- **O telefone pede ao autopreenchimento o número nacional.** Com `autocomplete="tel"`, o navegador preenche `+55 11 …` e a máscara transformaria o 55 em DDD; `tel-national` traz só DDD e número (`CustomerFields`).
- **O pedido é marcado como feito antes de esvaziar o carrinho.** O carrinho esvazia antes de a rota trocar para a confirmação; sem a marcação, o redirecionamento de "carrinho vazio" mandaria a pessoa para `/cart` no meio do caminho (`CheckoutPage`).
- **Os valores iniciais do formulário são calculados uma vez com `useState`.** O React Hook Form trata uma função em `defaultValues` como valores assíncronos, e o formulário começaria sem forma de pagamento (`CheckoutPage`).
- **As rotas sob demanda usam o `lazy` na forma de função.** Na forma de objeto, o React Router esvazia o próprio objeto depois de carregar, e um segundo router criado com as mesmas rotas (como nos testes) ficaria sem a página (`routes.tsx`).
- **Nos testes, requisição sem handler é erro.** No MSW 3 a opção se chama `onUnhandledFrame`; com o nome antigo (`onUnhandledRequest`) ela é ignorada e a requisição iria para a DummyJSON de verdade (`src/test/setup.ts`).

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

| Comando                | O que faz                                             |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | sobe o app em modo de desenvolvimento                 |
| `npm test`             | roda os testes uma vez                                |
| `npm run test:watch`   | roda os testes a cada mudança                         |
| `npm run lint`         | verifica o código com o oxlint                        |
| `npm run format`       | formata o código com o Prettier                       |
| `npm run format:check` | confere a formatação sem alterar os arquivos          |
| `npm run build`        | checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview`      | serve a versão de produção localmente                 |

### Integração contínua

A cada push, em qualquer branch, o GitHub Actions (`.github/workflows/ci.yml`) instala as dependências com `npm ci` usando a versão do Node do `.nvmrc` e roda, nesta ordem, `npm run format:check`, `npm run lint`, `npm test` e `npm run build`. Também dá para rodar à mão pela aba Actions do repositório.

## Funcionalidades

- **Catálogo:**
  - 12 produtos por página, vindos da API;
  - página e categoria ficam na URL, e dá para filtrar por categoria;
  - há estados de carregando, erro e vazio;
  - a página anterior continua na tela enquanto a próxima carrega.
- **Cache de telas:**
  - o detalhe do produto abre na hora com os dados que vieram na lista;
  - voltar para o catálogo mostra a mesma página, na mesma posição, sem buscar de novo;
  - a próxima página já é buscada antes do clique.
- **Carrinho:**
  - adicionar pelo detalhe do produto, com contador no cabeçalho;
  - mudar quantidades e remover itens, sempre dentro do limite do estoque;
  - o carrinho continua lá depois de atualizar a página e fica igual em todas as abas abertas;
  - fica salvo no `localStorage`, e dado corrompido vira carrinho vazio.
- **Checkout:**
  - dados pessoais, endereço e pagamento por cartão de crédito (até 12x sem juros), Pix (5% de desconto) ou boleto;
  - validação campo a campo e máscaras de CPF, telefone, CEP e cartão;
  - os campos mudam conforme a forma de pagamento, e o total é recalculado;
  - o envio é simulado com cerca de 1 s de espera, e o botão fica desabilitado enquanto envia, então um clique duplo não gera dois pedidos;
  - um pagamento recusado mostra o erro sem perder o que foi digitado;
  - dados pessoais e endereço ficam salvos como rascunho na aba (`sessionStorage`); dados de pagamento nunca são salvos.
- **Confirmação:** mostra o número do pedido, o total e a forma de pagamento.
- **Carregamento sob demanda:** o código do checkout (formulário, validação e formas de pagamento) só é baixado quando a pessoa vai finalizar a compra. Enquanto ele chega, uma barra no topo mostra que a página está carregando.

## Para testar

Com `npm run dev` rodando:

- **Cache de telas:** vá até a página 3 do catálogo, role a página, abra um produto e clique em "Voltar". A lista aparece na hora, na mesma posição.
- **Checkout:** use dados fictícios. O CPF `529.982.247-25` é válido para teste, e qualquer validade futura serve para o cartão.

| Cartão                | Resultado                                      |
| --------------------- | ---------------------------------------------- |
| `4242 4242 4242 4242` | aprovado                                       |
| `4000 0000 0000 0002` | recusado (mostra o erro e mantém o formulário) |

Pix e boleto são sempre aprovados.
