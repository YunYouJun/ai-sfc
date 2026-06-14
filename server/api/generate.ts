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
import { callAccountApi, generateCoupletsViaCloudbase, getCloudbaseApp } from '../../packages/server/cloudbase'
import { readBearerToken, verifyCloudBaseToken } from '../../packages/server/identity'

interface GenerateBody {
  prompt?: unknown
  bizId?: unknown
}

interface CloudbaseRuntime {
  envId: string
  secretId: string
  secretKey: string
  internalToken: string
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
    secretId: readProviderString(runtimeConfig.tencentApiSecretId),
    secretKey: readProviderString(runtimeConfig.tencentApiSecretKey),
    internalToken: readProviderString(runtimeConfig.accountApiInternalToken),
    modelGroup: readProviderString(runtimeConfig.cloudbaseModelGroup) || 'cloudbase',
    model: readProviderString(runtimeConfig.cloudbaseModel) || defaultAiModel,
    cost: Math.max(1, Math.round(Number(runtimeConfig.costPerGeneration) || 1)),
  }
}

function isCloudbaseConfigured(cb: CloudbaseRuntime) {
  return !!(cb.envId && cb.secretId && cb.secretKey && cb.internalToken)
}

/** 登录扣费：鉴权 → 预扣云币 → CloudBase 内置大模型生成 → 失败退款 */
async function generatePaid(event: H3Event, prompt: string, bizId: string, cb: CloudbaseRuntime) {
  const token = readBearerToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Login required',
      message: '请先登录后再生成。',
    })
  }

  const user = await verifyCloudBaseToken(cb.envId, token)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid session',
      message: '登录态已失效，请重新登录。',
    })
  }

  const app = getCloudbaseApp(cb)
  const effectiveBizId = bizId || `gen-${user.id}-${Date.now()}`

  // 预扣（bizId 幂等，同一 bizId 只扣一次）
  let balance: number
  try {
    const res = await callAccountApi<{ balance: number, deduped: boolean }>(app, 'deductCoinForUser', {
      serviceToken: cb.internalToken,
      userId: user.id,
      appId: APP_ID,
      amount: cb.cost,
      bizId: effectiveBizId,
    })
    balance = res.balance
  }
  catch (error) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Insufficient balance',
      message: readGenerateError(error),
    })
  }

  // 生成
  let coupletData
  try {
    coupletData = await generateCoupletsViaCloudbase(app, prompt, cb.modelGroup, cb.model)
  }
  catch (error) {
    console.error('[api/generate] cloudbase model failed:', readGenerateError(error))
  }

  if (!coupletData) {
    // 生成失败 → 退款（refId=bizId 幂等入账）
    await callAccountApi(app, 'adminAdjustCoin', {
      serviceToken: cb.internalToken,
      userId: user.id,
      appId: APP_ID,
      amount: cb.cost,
      refId: effectiveBizId,
      reason: 'generate-failed',
      operator: APP_ID,
    }).catch(() => {})

    throw createError({
      statusCode: 502,
      statusMessage: 'Model request failed',
      message: '模型生成失败，已退回云币，请重试。',
    })
  }

  return { ...coupletData, balance }
}

/** 降级：未配置 CloudBase 时回退到服务端 env key（不鉴权、不扣费） */
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

  // 配齐 CloudBase → 走登录扣费；否则降级到当前 DeepSeek 行为
  if (isCloudbaseConfigured(cloudbase))
    return await generatePaid(event, prompt, readProviderString(body.bizId), cloudbase)

  return await generateFallback(prompt, runtimeConfig)
})
