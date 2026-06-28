import type { CoupletMessage, SprintFestivalCouplets } from '../ai/src/couplets'
import { buildCoupletMessages, parseCoupletContent } from '../ai/src/couplets'

/** ai-gateway 返回的通用结果（结构与 cloudbase.ts 的 GatewayChatResult 一致；此处自定义以与传输层解耦） */
export type PaidChatOutcome
  = | { ok: true, content: string, balance: number, deduped: boolean }
    | { ok: false, code: string, message: string }

export interface PaidGenerationDeps {
  /**
   * 单次原子业务调用：把已构造的 messages 交给 yunle ai-gateway，由网关完成
   * 「验登录 + 余额校验 + 受控调 AI + 扣费」，回 content/balance。
   */
  chat: (token: string, messages: CoupletMessage[], bizId: string) => Promise<PaidChatOutcome>
}

export interface PaidGenerationInput {
  token: string | null
  prompt: string
  bizId: string
}

export type PaidGenerationResult
  = | { ok: true, couplets: SprintFestivalCouplets, balance: number }
    | { ok: false, statusCode: 400 | 401 | 402 | 502, message: string }

/** ai-gateway 业务码 → HTTP 状态码 */
const CODE_STATUS: Record<string, 400 | 401 | 402 | 502> = {
  unauthorized: 401,
  insufficient: 402,
  ai_failed: 502,
  bad_request: 400,
  unknown_app: 400,
}

/**
 * 登录扣费生成编排（解耦版）：构造春联 messages → 交 yunle ai-gateway 单次原子完成
 * 「验登录 + 扣费 + 受控调 AI」→ 把返回文本解析为春联。
 *
 * 与旧版「查余额 → 用用户 token 直调 AI → 扣费」三步可绕过不同：计费与 AI 调用都在 yunle
 * 服务端（端用户 token 不能直打 AI 网关），从根上堵白嫖洞。本函数只做春联域的
 * 「构造 / 解析 / 错误映射」，与 CloudBase / h3 解耦（依赖注入），便于单测。
 */
export async function runPaidGeneration(
  input: PaidGenerationInput,
  deps: PaidGenerationDeps,
): Promise<PaidGenerationResult> {
  if (!input.token)
    return { ok: false, statusCode: 401, message: '请先登录后再生成。' }

  let outcome: PaidChatOutcome
  try {
    outcome = await deps.chat(input.token, buildCoupletMessages(input.prompt), input.bizId)
  }
  catch (error) {
    // 传输层异常：鉴权类（网关拒 token）→ 401，其余 → 502
    return isAuthError(error)
      ? { ok: false, statusCode: 401, message: '登录态已失效，请重新登录。' }
      : { ok: false, statusCode: 502, message: '生成服务暂时不可用，请稍后再试。' }
  }

  if (!outcome.ok)
    return { ok: false, statusCode: CODE_STATUS[outcome.code] ?? 502, message: outcome.message }

  let couplets: SprintFestivalCouplets | undefined
  try {
    couplets = parseCoupletContent(outcome.content)
  }
  catch {
    couplets = undefined
  }
  if (!couplets)
    return { ok: false, statusCode: 502, message: '模型返回内容无法解析为春联，请重试。' }

  return { ok: true, couplets, balance: outcome.balance }
}

/** ofetch / fetch 异常是否为鉴权类（401/403） */
function isAuthError(error: unknown): boolean {
  const status = (error as { status?: number, statusCode?: number })?.status
    ?? (error as { statusCode?: number })?.statusCode
  return status === 401 || status === 403
}
