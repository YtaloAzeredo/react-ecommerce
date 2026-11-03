export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function applyPattern(value: string, pattern: string): string {
  const digits = onlyDigits(value)
  let result = ''
  let index = 0
  for (const char of pattern) {
    if (index >= digits.length) break
    if (char === '#') {
      result += digits[index]
      index++
    } else {
      result += char
    }
  }
  return result
}

export function formatCpf(value: string): string {
  return applyPattern(value, '###.###.###-##')
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value)
  return applyPattern(digits, digits.length > 10 ? '(##) #####-####' : '(##) ####-####')
}

export function formatCep(value: string): string {
  return applyPattern(value, '#####-###')
}

export function formatCardNumber(value: string): string {
  return applyPattern(value, '#### #### #### #### ###')
}

export function formatExpiry(value: string): string {
  return applyPattern(value, '##/##')
}
