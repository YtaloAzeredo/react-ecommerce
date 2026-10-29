import type { RouteObject } from 'react-router'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
