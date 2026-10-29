import type { RouteObject } from 'react-router'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
