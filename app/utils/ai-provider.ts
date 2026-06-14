export const defaultAiBaseURL = 'https://api.deepseek.com/v1'
export const defaultAiModel = 'deepseek-chat'

export interface AiProviderSettings {
  baseURL: string
  model: string
  apiKey: string
}

export interface AiProviderRequest {
  baseURL?: string
  model?: string
  apiKey?: string
}

export function createDefaultAiProviderSettings(): AiProviderSettings {
  return {
    baseURL: defaultAiBaseURL,
    model: defaultAiModel,
    apiKey: '',
  }
}

export function readProviderString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function sanitizeAiProviderRequest(value: unknown): AiProviderRequest {
  if (!value || typeof value !== 'object')
    return {}

  const source = value as Record<string, unknown>
  const baseURL = readProviderString(source.baseURL)
  const model = readProviderString(source.model)
  const apiKey = readProviderString(source.apiKey)

  return {
    ...(baseURL ? { baseURL } : {}),
    ...(model ? { model } : {}),
    ...(apiKey ? { apiKey } : {}),
  }
}
