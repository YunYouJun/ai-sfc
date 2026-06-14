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
import { deductCloudbaseCoin, generateCoupletsViaCloudbase, getCloudbaseBalance } from '../../packages/server/cloudbase'
import { readBearerToken } from '../../packages/server/identity'

interface GenerateBody {
  prompt?: unknown
  bizId?: unknown
}

interface CloudbaseRuntime {
  envId: string
  modelGroup: string
  model: string
  cost: number
}

const APP_ID = 'ai-sfc'

function readGenerateError(error: unknown) {
  if (error instanceof Error)
    return error.message

  return '模型接口请求失败'
}

function readCloudbaseRuntime(runtimeConfig: Record<string, unknown>): CloudbaseRuntime {
  return {
    envId: readProviderString(runtimeConfig.cloudbaseEnvId),
    modelGroup: readProviderString(runtimeConfig.cloudbaseModelGroup) || 'cloudbase',
    model: readProviderString(runtimeConfig.cloudbaseModel) || defaultAiModel,
    cost: Math.max(1, Math.round(Number(runtimeConfig.costPerGeneration) || 1)),
  }
}

/** 登录扣费：用用户 access_token HTTP 直调 CloudBase（查余额→生成→成功后扣，编排见 runPaidGeneration） */
async function generatePaid(event: H3Event, prompt: string, bizId: string, cb: CloudbaseRuntime) {
  const result = await runPaidGeneration(
    { token: readBearerToken(event), prompt, bizId: bizId || globalThis.crypto.randomUUID(), cost: cb.cost },
    {
      getBalance: token => getCloudbaseBalance(cb.envId, token),
      generate: (token, input) => generateCoupletsViaCloudbase(cb.envId, token, cb.modelGroup, cb.model, input),
      deduct: (token, { amount, bizId: id }) => deductCloudbaseCoin(cb.envId, token, { appId: APP_ID, amount, bizId: id }),
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

/** 降级：未配 CloudBase envId 时回退到服务端 env key（不鉴权、不扣费） */
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
  const cloudbase = readCloudbaseRuntime(runtimeConfig)

  // 配了 CloudBase envId → 登录扣费链路（用用户 token）；否则降级 DeepSeek（本地未配时仍可跑）
  if (cloudbase.envId)
    return await generatePaid(event, prompt, readProviderString(body.bizId), cloudbase)

  return await generateFallback(prompt, runtimeConfig)
})
