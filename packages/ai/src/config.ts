/* eslint-disable import/no-mutable-exports */
import type { ClientOptions } from 'openai'
import OpenAI from 'openai'

export const defaultAiServiceUrl = 'https://api.deepseek.com/v1'
export const defaultBaseModel = 'deepseek-chat'

export interface AiClientConfig {
  apiKey?: string
  baseURL?: string
  model?: string
}

export class MissingAiApiKeyError extends Error {
  constructor() {
    super('Missing model API token')
    this.name = 'MissingAiApiKeyError'
  }
}

export const baseChatCompletionCreateParams: Partial<OpenAI.ChatCompletionCreateParamsNonStreaming> = {
  max_tokens: 100,
  // TODO: for use control
  // presence_penalty: 0,
  // frequency_penalty: 0,
  // stream: true
}

export let openai: OpenAI | undefined
export let baseModel = defaultBaseModel

function readConfigString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveAiClientConfig(options: AiClientConfig = {}) {
  const apiKey = readConfigString(options.apiKey)
  const baseURL = readConfigString(options.baseURL) || defaultAiServiceUrl
  const model = readConfigString(options.model) || baseModel || defaultBaseModel

  return {
    apiKey,
    baseURL,
    model,
  }
}

export function createOpenAIClient(options: AiClientConfig = {}) {
  const config = resolveAiClientConfig(options)

  if (!config.apiKey)
    throw new MissingAiApiKeyError()

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  })
}

export function getOpenAIClient(options?: AiClientConfig) {
  if (options)
    return createOpenAIClient(options)

  if (!openai)
    throw new MissingAiApiKeyError()

  return openai
}

export function createOpenAIInstance(options: ClientOptions & AiClientConfig) {
  const config = resolveAiClientConfig(options)

  if (!config.apiKey)
    throw new MissingAiApiKeyError()

  openai = new OpenAI({
    ...options,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  })

  baseModel = config.model
  return openai
}

export function setBaseModel(model: string) {
  baseModel = readConfigString(model) || defaultBaseModel
}
