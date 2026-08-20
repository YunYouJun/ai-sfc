import type { H3Event } from 'h3'
import process from 'node:process'
import { createError, readBody } from 'h3'
import { MissingAiApiKeyError } from '~~/packages/ai/src/config'
import {
  defaultAiBaseURL,
  defaultAiModel,
  readProviderString,
} from '../../app/utils/ai-provider'
import { getCoupletDataByPrompt } from '../../packages/server'
import { runPaidGeneration } from '../../packages/server/billing'
import { readBearerToken } from '../../packages/server/identity'
import { aiChatViaRuntime } from '../../packages/server/runtime'

interface GenerateBody {
  prompt?: unknown
  bizId?: unknown
}

const APP_ID = 'ai-sfc'

function readGenerateError(error: unknown) {
  if (error instanceof Error)
    return error.message

  return '模型接口请求失败'
}

/**
 * 登录扣费：经统一 AI Runtime 完成「验登录 + 扣费 + 受控调 AI」。
 * 模型 / 计价由 YunLeFun 服务端按 applicationId 决定，本侧只传 Runtime URL 与用户 token。
 */
async function generatePaid(event: H3Event, prompt: string, bizId: string, runtimeBaseUrl: string) {
  const result = await runPaidGeneration(
    { token: readBearerToken(event), prompt, bizId: bizId || globalThis.crypto.randomUUID() },
    {
      chat: (token, messages, id) => aiChatViaRuntime(runtimeBaseUrl, token, {
        applicationId: APP_ID,
        messages,
        idempotencyKey: id,
        origin: 'https://ai-sfc.yunle.fun',
      }),
    },
  )

  if (!result.ok) {
    throw createError({
      statusCode: result.statusCode,
      message: result.message,
    })
  }

  return { ...result.couplets, balance: result.balance }
}

/** 降级：未配置 Runtime 时回退到服务端 env key（不鉴权、不扣费，仅供本地开发）。 */
async function generateFallback(prompt: string, runtimeConfig: Record<string, unknown>) {
  const provider = {
    apiKey: readProviderString(runtimeConfig.openaiApiKey) || readProviderString(process.env.OPENAI_API_KEY),
    baseURL: readProviderString(runtimeConfig.openaiBaseURL) || readProviderString(process.env.AI_SERVICE_URL) || defaultAiBaseURL,
    model: readProviderString(runtimeConfig.openaiModel) || readProviderString(process.env.MODEL_NAME) || defaultAiModel,
  }

  try {
    const coupletData = await getCoupletDataByPrompt(prompt, provider)
    if (!coupletData) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Invalid model response',
        message: '模型返回内容无法解析为春联。',
      })
    }
    return coupletData
  }
  catch (error) {
    if (typeof (error as { statusCode?: unknown }).statusCode === 'number')
      throw error

    if (error instanceof MissingAiApiKeyError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing AI API token',
        message: '缺少模型 API Token，请登录使用云币生成，或在服务端配置 OPENAI_API_KEY。',
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Model request failed',
      message: readGenerateError(error),
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = event.method === 'GET'
    ? {}
    : await readBody<GenerateBody>(event).catch(() => ({}))
  const prompt = readProviderString(body.prompt)

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
      message: '请输入春联提示词。',
    })
  }

  const runtimeConfig = useRuntimeConfig(event) as Record<string, unknown>
  const runtimeBaseUrl = readProviderString(runtimeConfig.aiRuntimeBaseUrl)

  // 配置 Runtime 后启用登录扣费链路；否则降级到仅供本地开发的 BYOK。
  if (runtimeBaseUrl)
    return await generatePaid(event, prompt, readProviderString(body.bizId), runtimeBaseUrl)

  return await generateFallback(prompt, runtimeConfig)
})
