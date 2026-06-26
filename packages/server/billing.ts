import type { SprintFestivalCouplets } from '../ai/src/couplets'

export interface PaidGenerationDeps {
  /** 查云币余额（顺便验证 token：无效应抛错） */
  getBalance: (token: string) => Promise<number>
  /** 生成春联（无法解析返回 undefined，或抛错） */
  generate: (token: string, prompt: string) => Promise<SprintFestivalCouplets | undefined>
  /** 扣云币（bizId 幂等） */
  deduct: (token: string, params: { amount: number, bizId: string }) => Promise<{ balance: number }>
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
 * 登录扣费生成编排：查余额（验证 token）→ 余额足够 → 生成 → 成功后扣（bizId 幂等）。
 *
 * 生成失败不扣费（用户不为失败付费）；扣费本身失败不浪费已生成结果，余额回退本地估算。
 * 与 CloudBase / h3 解耦（依赖注入），便于单测。
 *
 * ⚠️ 荣誉计费（已知边界，团队接受）：0 密钥设计下服务端用「用户自己的」access_token 调
 * CloudBase 模型组，而该 token 在用户浏览器里、本就能直打 `/v1/ai/<group>/chat/completions`
 * 免费生成、绕过此处扣费——扣云币是「应用内/服务端编排」级约束，非密码学强制。利用门槛=需
 * 有 yunle 账号 + 知道组名（本仓库未泄露组名，它在私有 runtimeConfig）。春联场景低风险故接受；
 * 若要不可绕过，须把生成挪进 yunle 付费云函数并锁模型组（端用户 token 禁直调），见架构记忆。
 */
export async function runPaidGeneration(
  input: PaidGenerationInput,
  deps: PaidGenerationDeps,
): Promise<PaidGenerationResult> {
  if (!input.token)
    return { ok: false, statusCode: 401, message: '请先登录后再生成。' }

  // 查余额（顺便验证 token：无效则抛错）
  let balance: number
  try {
    balance = await deps.getBalance(input.token)
  }
  catch {
    return { ok: false, statusCode: 401, message: '登录态已失效，请重新登录。' }
  }

  if (balance < input.cost)
    return { ok: false, statusCode: 402, message: '云币余额不足，请充值后再生成。' }

  // 生成
  let couplets: SprintFestivalCouplets | undefined
  try {
    couplets = await deps.generate(input.token, input.prompt)
  }
  catch {
    couplets = undefined
  }
  if (!couplets)
    return { ok: false, statusCode: 502, message: '模型生成失败，请重试（未扣云币）。' }

  // 生成成功后扣费；扣费异常不浪费已生成结果，余额回退本地估算（下次刷新校准）
  let nextBalance = balance - input.cost
  try {
    nextBalance = (await deps.deduct(input.token, { amount: input.cost, bizId: input.bizId })).balance
  }
  catch {
    // 已生成、扣费失败：返回估算余额
  }

  return { ok: true, couplets, balance: nextBalance }
}
