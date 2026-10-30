import type { RouteObject } from 'react-router'
import { CartPage } from '@/features/cart/pages/CartPage'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage'
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage'
import { OrderSuccessPage } from '@/features/checkout/pages/OrderSuccessPage'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/success', element: <OrderSuccessPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
