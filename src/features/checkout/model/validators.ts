import { onlyDigits } from './masks'

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  const checkDigit = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10])
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\s/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function isValidExpiry(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  return year * 12 + month >= now.getFullYear() * 12 + now.getMonth() + 1
}
