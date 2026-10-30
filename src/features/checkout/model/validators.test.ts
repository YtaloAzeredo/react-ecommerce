import { describe, expect, it } from 'vitest'
import { isValidCardNumber, isValidCpf, isValidExpiry } from './validators'

describe('isValidCpf', () => {
  it('aceita CPF com dígitos verificadores corretos, com ou sem máscara', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false)
  })

  it('rejeita todos os dígitos iguais', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false)
  })

  it('rejeita tamanho errado', () => {
    expect(isValidCpf('123')).toBe(false)
    expect(isValidCpf('')).toBe(false)
  })
})

describe('isValidCardNumber', () => {
  it('aceita números que passam no Luhn', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true)
    expect(isValidCardNumber('4000 0000 0000 0002')).toBe(true)
  })

  it('rejeita número que não passa no Luhn', () => {
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false)
  })

  it('rejeita tamanho fora de 13 a 19 dígitos', () => {
    expect(isValidCardNumber('4242')).toBe(false)
    expect(isValidCardNumber('')).toBe(false)
  })

  it('rejeita caracteres que não são dígitos', () => {
    expect(isValidCardNumber('4242 4242 4242 424a')).toBe(false)
  })
})

describe('isValidExpiry', () => {
  const now = new Date(2026, 9, 28)

  it('aceita o mês atual até o fim do mês', () => {
    expect(isValidExpiry('10/26', now)).toBe(true)
    expect(isValidExpiry('10/26', new Date(2026, 9, 31, 23, 59))).toBe(true)
  })

  it('rejeita mês passado', () => {
    expect(isValidExpiry('09/26', now)).toBe(false)
    expect(isValidExpiry('12/25', now)).toBe(false)
  })

  it('aceita data futura', () => {
    expect(isValidExpiry('12/30', now)).toBe(true)
    expect(isValidExpiry('01/27', now)).toBe(true)
  })

  it('rejeita mês inválido e formato incompleto', () => {
    expect(isValidExpiry('13/27', now)).toBe(false)
    expect(isValidExpiry('00/27', now)).toBe(false)
    expect(isValidExpiry('1/27', now)).toBe(false)
  })
})
