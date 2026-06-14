import type { SprintFestivalCouplets } from '../ai/src/couplets'

export interface PaidUser {
  id: string
}

export interface PaidGenerationDeps {
  /** 校验 token → 用户身份（null 表示无效，不扣费） */
  verifyToken: (token: string) => Promise<PaidUser | null>
  /** 预扣云币（余额不足等应抛错；bizId 幂等） */
  deduct: (params: { userId: string, amount: number, bizId: string }) => Promise<{ balance: number, deduped: boolean }>
  /** 退款（生成失败时补偿，refId 幂等） */
  refund: (params: { userId: string, amount: number, refId: string }) => Promise<void>
  /** 生成春联（无法解析返回 undefined，或抛错） */
  generate: (prompt: string) => Promise<SprintFestivalCouplets | undefined>
}

export interface PaidGenerationInput {
  token: string | null
  prompt: string
  bizId: string
  cost: number
}

export type PaidGenerationResult
  = | { ok: true, couplets: SprintFestivalCouplets, balance: number }
    | { ok: false, statusCode: 401 | 402 | 502, message: string }

/**
 * 登录扣费生成编排：鉴权 → 预扣（bizId 幂等）→ 生成 → 失败退款。
 *
 * 与 CloudBase / h3 解耦（依赖注入），便于单测；真实实现在 server/api/generate.ts 注入。
 */
export async function runPaidGeneration(
  input: PaidGenerationInput,
  deps: PaidGenerationDeps,
): Promise<PaidGenerationResult> {
  if (!input.token)
    return { ok: false, statusCode: 401, message: '请先登录后再生成。' }

  const user = await deps.verifyToken(input.token)
  if (!user)
    return { ok: false, statusCode: 401, message: '登录态已失效，请重新登录。' }

  // 预扣（bizId 幂等，同一 bizId 只扣一次）
  let balance: number
  try {
    const res = await deps.deduct({ userId: user.id, amount: input.cost, bizId: input.bizId })
    balance = res.balance
  }
  catch (error) {
    return { ok: false, statusCode: 402, message: error instanceof Error ? error.message : '云币扣费失败' }
  }

  // 生成
  let couplets: SprintFestivalCouplets | undefined
  try {
    couplets = await deps.generate(input.prompt)
  }
  catch {
    couplets = undefined
  }

  if (!couplets) {
    // 生成失败 → 退款（refId=bizId 幂等），退款异常不影响对用户的报错
    await deps.refund({ userId: user.id, amount: input.cost, refId: input.bizId }).catch(() => {})
    return { ok: false, statusCode: 502, message: '模型生成失败，已退回云币，请重试。' }
  }

  return { ok: true, couplets, balance }
}
