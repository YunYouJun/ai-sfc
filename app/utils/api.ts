import type { SprintFestivalCouplets } from '~~/packages/ai/src/couplets'

export interface ApiGenerateOk {
  ok: true
  couplets: SprintFestivalCouplets
  /** 扣费后云币余额（仅登录扣费链路返回） */
  balance?: number
}
export interface ApiGenerateErr {
  ok: false
  /** HTTP 状态码：401 登录失效 / 402 余额不足 / 其它 */
  statusCode?: number
  message: string
}
export type ApiGenerateResult = ApiGenerateOk | ApiGenerateErr

export interface WalletBalance {
  /** 云币余额；未配置 CloudBase 或接口缺失时为 null */
  balance: number | null
  costPerGeneration: number
}

/**
 * 生成春联（登录用户经服务端，按次扣云币）。
 * token 为 CloudBase access_token，bizId 为本次生成的幂等键。
 */
export async function apiGenerate(params: {
  prompt: string
  token?: string
  bizId?: string
}): Promise<ApiGenerateResult> {
  try {
    const data = await $fetch<SprintFestivalCouplets & { balance?: number }>('/api/generate', {
      method: 'POST',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : undefined,
      body: { prompt: params.prompt, bizId: params.bizId },
    })
    return { ok: true, couplets: data, balance: data.balance }
  }
  catch (error: any) {
    console.error('apiGenerate', error)
    return {
      ok: false,
      statusCode: error?.statusCode ?? error?.response?.status,
      message: error?.data?.message || error?.message || '生成失败，请稍后重试',
    }
  }
}

/** 查询当前登录用户云币余额 */
export async function apiGetBalance(token: string): Promise<WalletBalance | null> {
  if (!token)
    return null

  try {
    return await $fetch<WalletBalance>('/api/wallet/balance', {
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  catch (error) {
    console.error('apiGetBalance', error)
    return null
  }
}
