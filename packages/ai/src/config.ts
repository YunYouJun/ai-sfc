/* eslint-disable import/no-mutable-exports */
import type { ClientOptions } from 'openai'
import OpenAI from 'openai'

const deepseekApiUrl = 'https://api.deepseek.com/v1'

// const aiServiceUrl = process?.env.AI_SERVICE_URL || deepseekApiUrl
const aiServiceUrl = deepseekApiUrl
// export const baseModel = process?.env.MODEL_NAME || 'deepseek-chat'

// export const openai = new OpenAI({
//   baseURL: aiServiceUrl,
//   // apiKey: process?.env.OPENAI_API_KEY, // This is the default and can be omitted
// })

export const baseChatCompletionCreateParams: Partial<OpenAI.ChatCompletionCreateParamsNonStreaming> = {
  max_tokens: 100,
  // TODO: for use control
  // presence_penalty: 0,
  // frequency_penalty: 0,
  // stream: true
}

export let openai: OpenAI
export let baseModel = 'deepseek-chat'

export function createOpenAIInstance(options: ClientOptions) {
  openai = new OpenAI({
    baseURL: aiServiceUrl,
    ...options,
  })
}

export function setBaseModel(model: string) {
  baseModel = model
}
