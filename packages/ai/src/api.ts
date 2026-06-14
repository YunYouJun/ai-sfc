import type OpenAI from 'openai'
import type { AiClientConfig } from './config'
import consola from 'consola'
// TODO: pass params
import { config } from '~/config'

import {
  baseChatCompletionCreateParams,
  getOpenAIClient,
  resolveAiClientConfig,
} from './config'
import { buildCoupletMessages } from './couplets'

export async function getCompletion(msg: string, options?: AiClientConfig) {
  const client = getOpenAIClient(options)
  const aiConfig = resolveAiClientConfig(options)

  const chatCompletion = await client.chat.completions.create({
    ...baseChatCompletionCreateParams,
    messages: [{ role: 'user', content: msg }],
    model: aiConfig.model,
  })

  return chatCompletion.choices
}

export async function getCouplets(prompt = '', options?: AiClientConfig) {
  const messages = buildCoupletMessages(prompt, config.inputMaxLength) as OpenAI.ChatCompletionMessageParam[]

  const client = getOpenAIClient(options)
  const aiConfig = resolveAiClientConfig(options)

  const chatCompletion = await client.chat.completions.create({
    ...baseChatCompletionCreateParams,
    messages,
    model: aiConfig.model,
    // stream: true
  })

  consola.debug(chatCompletion)
  return chatCompletion.choices[0]?.message
}
