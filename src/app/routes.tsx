import type { RouteObject } from 'react-router'
import { CartPage } from '@/features/cart/pages/CartPage'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

const pageLoading = <StatusMessage>Carregando…</StatusMessage>

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
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
