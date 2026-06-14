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

/** 登录扣费：鉴权 → 预扣云币 → CloudBase 大模型生成 → 失败退款（编排在 runPaidGeneration，便于单测） */
async function generatePaid(event: H3Event, prompt: string, bizId: string, cb: CloudbaseRuntime) {
  const app = getCloudbaseApp(cb)
  const effectiveBizId = bizId || globalThis.crypto.randomUUID()

  const result = await runPaidGeneration(
    { token: readBearerToken(event), prompt, bizId: effectiveBizId, cost: cb.cost },
    {
      verifyToken: token => verifyCloudBaseToken(cb.envId, token),
      deduct: ({ userId, amount, bizId: id }) => callAccountApi<{ balance: number, deduped: boolean }>(app, 'deductCoinForUser', {
        serviceToken: cb.internalToken,
        userId,
        appId: APP_ID,
        amount,
        bizId: id,
      }),
      refund: async ({ userId, amount, refId }) => {
        await callAccountApi(app, 'adminAdjustCoin', {
          serviceToken: cb.internalToken,
          userId,
          appId: APP_ID,
          amount,
          refId,
          reason: 'generate-failed',
          operator: APP_ID,
        })
      },
      generate: input => generateCoupletsViaCloudbase(app, input, cb.modelGroup, cb.model),
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
