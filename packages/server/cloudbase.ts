import type { CloudBase, ICloudBaseConfig } from '@cloudbase/node-sdk'
import { createRequire } from 'node:module'
import { buildCoupletMessages, parseCoupletContent } from '../ai/src/couplets'

interface CloudbaseModule {
  init: (config?: ICloudBaseConfig) => CloudBase
}

export interface CloudbaseCredentials {
  envId: string
  secretId: string
  secretKey: string
}

let cloudbaseModule: CloudbaseModule | null = null

// 惰性加载：预渲染阶段 nitro 以虚拟入口执行顶层代码，顶层 require 可能解析失败
function loadCloudbase(): CloudbaseModule {
  if (!cloudbaseModule) {
    const require = createRequire(import.meta.url)
    cloudbaseModule = require('@cloudbase/node-sdk') as CloudbaseModule
  }
  return cloudbaseModule
}

let cachedApp: CloudBase | null = null
let cachedKey = ''

/** 以运营方密钥初始化 CloudBase admin（带缓存） */
export function getCloudbaseApp(credentials: CloudbaseCredentials): CloudBase {
  const cacheKey = `${credentials.envId}:${credentials.secretId}`
  if (cachedApp && cachedKey === cacheKey)
    return cachedApp

  cachedApp = loadCloudbase().init({
    env: credentials.envId,
    secretId: credentials.secretId,
    secretKey: credentials.secretKey,
  })
  cachedKey = cacheKey
  return cachedApp
}

/** 调用 yunle 已部署的 account-api 云函数，返回其 result */
export async function callAccountApi<T = unknown>(
  app: CloudBase,
  action: string,
  data: Record<string, unknown>,
): Promise<T> {
  const res = await app.callFunction({ name: 'account-api', data: { action, ...data } })
  return res.result as T
}

/**
 * 用 CloudBase 大模型生成春联。
 * group 为 GroupName（托管组 'cloudbase' 或自定义组 'custom-xxx'，后者经 CreateAIModel 接入第三方如 DeepSeek）；
 * model 为模型 id（自定义组填接入时在 Models 里定义的名字，如 deepseek-chat）。
 */
export async function generateCoupletsViaCloudbase(app: CloudBase, prompt: string, group: string, model: string) {
  const aiModel = app.ai().createModel(group)
  const result = await aiModel.generateText({
    model,
    messages: buildCoupletMessages(prompt),
  })
  return parseCoupletContent(result.text)
}
