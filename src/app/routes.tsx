import type { RouteObject } from 'react-router'
import { CartPage } from '@/features/cart/pages/CartPage'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

// Aparece no lugar da página quando o link de uma rota sob demanda é aberto direto, enquanto o
// código dela chega; o cabeçalho continua na tela.
const pageLoading = <StatusMessage>Carregando…</StatusMessage>

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      // O checkout (com o React Hook Form e as regras do formulário) só é baixado por quem vai
      // finalizar a compra: quem só navega pelo catálogo não paga por ele. A forma de função do
      // `lazy` é de propósito: na forma de objeto o React Router esvazia o próprio objeto depois de
      // carregar, e um segundo router criado com estas rotas (como nos testes) ficaria sem a página.
      {
        path: 'checkout',
        hydrateFallbackElement: pageLoading,
        lazy: async () => ({
          Component: (await import('@/features/checkout/pages/CheckoutPage')).CheckoutPage,
        }),
      },
      {
        path: 'checkout/success',
        hydrateFallbackElement: pageLoading,
        lazy: async () => ({
          Component: (await import('@/features/checkout/pages/OrderSuccessPage')).OrderSuccessPage,
        }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
