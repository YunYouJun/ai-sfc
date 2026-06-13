import type { SprintFestivalCouplets } from '../ai/src'

export function extractJsonObject(content: string) {
  const normalized = content.replace('```json\n', '').replace('```', '')
  const startPos = normalized.indexOf('{')
  const endPos = normalized.lastIndexOf('}')

  if (startPos === -1 || endPos === -1 || endPos < startPos)
    return ''

  return normalized.slice(startPos, endPos + 1)
}

export function parseCoupletContent(content: string | null | undefined) {
  const jsonContent = extractJsonObject(content || '')
  if (!jsonContent)
    return undefined

  const coupletData = JSON.parse(jsonContent) as SprintFestivalCouplets

  if (coupletData['上联'].endsWith('，') && coupletData['下联'].endsWith('。')) {
    coupletData['上联'] = coupletData['上联'].slice(0, -1)
    coupletData['下联'] = coupletData['下联'].slice(0, -1)
  }

  return coupletData
}
