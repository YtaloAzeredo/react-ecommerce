// Formato das respostas da DummyJSON, só com os campos que o app usa.

export interface ProductDto {
  id: number
  title: string
  description: string
  category: string
  price: number
  rating: number
  stock: number
  brand?: string
  thumbnail: string
  images: string[]
}

export interface ProductListDto {
  products: ProductDto[]
  total: number
  skip: number
  limit: number
}

export interface CategoryDto {
  slug: string
  name: string
  url: string
}
