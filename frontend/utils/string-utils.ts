/**
 * Abrevia um texto para um comprimento máximo, mantendo o início e o fim
 * @param text Texto a ser abreviado
 * @param maxLength Comprimento máximo desejado
 * @returns Texto abreviado
 */
export function abbreviateText(text: string, maxLength = 25): string {
  if (!text) return ""
  if (text.length <= maxLength) return text

  const startChars = Math.floor(maxLength / 2) - 1
  const endChars = Math.floor(maxLength / 2) - 2

  return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`
}

