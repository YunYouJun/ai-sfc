import type { SprintFestivalCouplets } from '~~/packages/ai/src/couplets'

export interface ServerGenerateResult extends SprintFestivalCouplets {
  error?: string
  /** 扣费后的云币余额（仅登录扣费链路返回） */
  balance?: number
}

export interface WalletBalance {
  /** 云币余额；未配置 CloudBase 或接口缺失时为 null */
  balance: number | null
  costPerGeneration: number
}

const fallbackResult: SprintFestivalCouplets = {
  上联: '网络出错网络差',
  下联: '热门火爆排队多',
  横批: '掉线断网',
  总结: '寄',
}

/**
 * 生成春联（登录用户经服务端，按次扣云币）。
 * token 为 CloudBase access_token，bizId 为本次生成的幂等键。
 */
export async function apiGenerate(params: {
  prompt: string
  token?: string
  bizId?: string
}): Promise<ServerGenerateResult> {
  try {
    return await $fetch<ServerGenerateResult>('/api/generate', {
      method: 'POST',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : undefined,
      body: { prompt: params.prompt, bizId: params.bizId },
    })
  }
  catch (error: any) {
    console.error('apiGenerate', error)
    return {
      ...fallbackResult,
      error: error?.data?.message || error?.message || '模型接口请求失败',
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
