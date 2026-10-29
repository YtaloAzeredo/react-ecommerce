export const API_URL = (import.meta.env.VITE_API_URL || 'https://dummyjson.com').replace(/\/$/, '')

export class HttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`A requisição falhou com status ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

type QueryParams = Record<string, string | number | undefined>

export async function httpGet<T>(
  path: string,
  options: { params?: QueryParams; signal?: AbortSignal } = {},
): Promise<T> {
  // Concatenação em vez de new URL(path, base): preserva um caminho na base (ex.: https://host/api).
  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, { signal: options.signal })
  if (!response.ok) throw new HttpError(response.status)
  return (await response.json()) as T
}
