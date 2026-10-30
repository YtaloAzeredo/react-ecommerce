import { describe, expect, it } from 'vitest'
import {
  CHECKOUT_DRAFT_KEY,
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from './checkoutDraft'

const customer = { fullName: 'Ana Souza', email: 'ana@example.com', cpf: '', phone: '' }
const address = { cep: '01310-100', street: 'Avenida Paulista', state: 'SP' as const }

describe('checkoutDraft', () => {
  it('sem rascunho devolve null', () => {
    expect(loadCheckoutDraft()).toBeNull()
  })

  it('salvar e carregar', () => {
    saveCheckoutDraft({ customer, address })

    expect(loadCheckoutDraft()).toEqual({ customer, address })
  })

  it('nunca grava dados de pagamento', () => {
    saveCheckoutDraft({
      customer,
      address,
      payment: { method: 'credit_card', cardNumber: '4242 4242 4242 4242', cvv: '987' },
    })

    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY) ?? ''
    expect(raw).not.toContain('4242')
    expect(raw).not.toContain('987')
    expect(raw).not.toContain('payment')
  })

  it('rascunho corrompido devolve null', () => {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, '{nao é json')
    expect(loadCheckoutDraft()).toBeNull()

    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, '{"customer":"x","address":{}}')
    expect(loadCheckoutDraft()).toBeNull()
  })

  it('estado fora da lista é descartado e o resto do rascunho fica', () => {
    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify({ customer, address: { street: 'Rua A', state: 'XX' } }),
    )

    expect(loadCheckoutDraft()).toEqual({ customer, address: { street: 'Rua A' } })
  })

  it('clear apaga o rascunho', () => {
    saveCheckoutDraft({ customer, address })

    clearCheckoutDraft()

    expect(loadCheckoutDraft()).toBeNull()
  })

  it('storage que lança erro não quebra', () => {
    const failing = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('cheio')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    } as unknown as Storage

    expect(loadCheckoutDraft(failing)).toBeNull()
    expect(() => saveCheckoutDraft({ customer, address }, failing)).not.toThrow()
    expect(() => clearCheckoutDraft(failing)).not.toThrow()
  })
})
