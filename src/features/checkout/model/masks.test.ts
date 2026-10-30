import { describe, expect, it } from 'vitest'
import {
  formatCardNumber,
  formatCep,
  formatCpf,
  formatExpiry,
  formatPhone,
  onlyDigits,
} from './masks'

describe('máscaras', () => {
  it('onlyDigits tira tudo que não é dígito', () => {
    expect(onlyDigits('(11) 98765-4321')).toBe('11987654321')
  })

  it('formatCpf', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCpf('5299')).toBe('529.9')
    expect(formatCpf('529')).toBe('529')
    expect(formatCpf('529.982.247-25999')).toBe('529.982.247-25')
  })

  it('formatPhone', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('119876543210')).toBe('(11) 98765-4321')
    expect(formatPhone('')).toBe('')
  })

  it('formatCep', () => {
    expect(formatCep('01310100')).toBe('01310-100')
    expect(formatCep('0131')).toBe('0131')
  })

  it('formatCardNumber', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumber('42424')).toBe('4242 4')
  })

  it('formatExpiry', () => {
    expect(formatExpiry('1228')).toBe('12/28')
    expect(formatExpiry('1')).toBe('1')
    expect(formatExpiry('12/289')).toBe('12/28')
  })
})
