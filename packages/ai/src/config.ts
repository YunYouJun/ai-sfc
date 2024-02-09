import 'dotenv/config'
import process from 'node:process'
import OpenAI from 'openai'

const deepseekApiUrl = 'https://api.deepseek.com/v1'

const aiServiceUrl = process.env.AI_SERVICE_URL || deepseekApiUrl

export const openai = new OpenAI({
  baseURL: aiServiceUrl,
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
})

export const baseModel = process.env.MODEL_NAME || 'deepseek-chat'

export const baseChatCompletionCreateParams: Partial<OpenAI.ChatCompletionCreateParamsNonStreaming> = {
  max_tokens: 100,
  // stream: true
}
