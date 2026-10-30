import { z } from 'zod'
import { BRAZILIAN_STATES, type CheckoutFormValues } from './checkoutSchema'

export const CHECKOUT_DRAFT_KEY = 'vitrine:checkout-draft:v1'

export type CheckoutDraft = {
  customer: Partial<CheckoutFormValues['customer']>
  address: Partial<CheckoutFormValues['address']>
}

// Só textos soltos: o rascunho guarda o que a pessoa digitou, ainda sem validar. Campos fora deste
// formato (inclusive qualquer coisa de pagamento) são descartados ao carregar.
const draftSchema = z.object({
  customer: z
    .object({ fullName: z.string(), email: z.string(), cpf: z.string(), phone: z.string() })
    .partial(),
  address: z
    .object({
      cep: z.string(),
      street: z.string(),
      number: z.string(),
      complement: z.string(),
      neighborhood: z.string(),
      city: z.string(),
      state: z.enum(BRAZILIAN_STATES).optional().catch(undefined),
    })
    .partial(),
})

function sessionStorageOr(storage?: Storage): Storage {
  return storage ?? window.sessionStorage
}

export function loadCheckoutDraft(storage?: Storage): CheckoutDraft | null {
  try {
    const raw = sessionStorageOr(storage).getItem(CHECKOUT_DRAFT_KEY)
    if (raw === null) return null
    const draft = draftSchema.safeParse(JSON.parse(raw))
    return draft.success ? draft.data : null
  } catch {
    return null
  }
}

// Dados de pagamento nunca vão para o storage: só dados pessoais e endereço são copiados.
export function saveCheckoutDraft(
  values: { customer?: unknown; address?: unknown; payment?: unknown },
  storage?: Storage,
): void {
  try {
    const draft = { customer: values.customer ?? {}, address: values.address ?? {} }
    sessionStorageOr(storage).setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // sem rascunho nesta sessão
  }
}

export function clearCheckoutDraft(storage?: Storage): void {
  try {
    sessionStorageOr(storage).removeItem(CHECKOUT_DRAFT_KEY)
  } catch {
    // nada a apagar
  }
}
