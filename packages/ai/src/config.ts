import 'dotenv/config'
import process from 'node:process'
import OpenAI from 'openai'

const deepseekApiUrl = 'https://api.deepseek.com/v1'

export const openai = new OpenAI({
  baseURL: deepseekApiUrl,
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
})

export const baseModel = 'deepseek-chat'

export const baseChatCompletionCreateParams: Partial<OpenAI.ChatCompletionCreateParamsNonStreaming> = {
  max_tokens: 300,
  // stream: true
}
