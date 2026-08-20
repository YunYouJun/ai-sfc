import { $fetch } from 'ofetch'

export interface RuntimeChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type RuntimeChatOutcome
  = | { ok: true, content: string, balance: number }
    | { ok: false, code: string, message: string }

/** 调用统一 AI Runtime；产品 prompt 与结果解析仍由应用层持有。 */
export async function aiChatViaRuntime(
  runtimeBaseUrl: string,
  token: string,
  params: { applicationId: string, messages: RuntimeChatMessage[], idempotencyKey: string, origin: string },
): Promise<RuntimeChatOutcome> {
  try {
    const result = await $fetch<{
      content: string
      asset?: { unit: 'coin' | 'micro_point', available: number }
    }>(`${runtimeBaseUrl.replace(/\/$/, '')}/ai/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': params.idempotencyKey,
        'Origin': params.origin,
        'X-Application-Id': params.applicationId,
      },
      body: {
        applicationId: params.applicationId,
        messages: params.messages,
      },
    })
    if (result.asset?.unit !== 'coin' || !Number.isSafeInteger(result.asset.available))
      return { ok: false, code: 'ai_failed', message: 'AI Runtime 返回了无效的结算结果。' }
    return { ok: true, content: result.content, balance: result.asset.available }
  }
  catch (error) {
    const source = error as {
      status?: number
      statusCode?: number
      data?: { error?: { code?: string, message?: string } }
    }
    const status = source.status ?? source.statusCode
    const runtimeCode = source.data?.error?.code
    const code = status === 401 || status === 403
      ? 'unauthorized'
      : status === 402 || ['AI_POINTS_INSUFFICIENT', 'COIN_INSUFFICIENT'].includes(runtimeCode ?? '')
        ? 'insufficient'
        : status === 400 ? 'bad_request' : 'ai_failed'
    return {
      ok: false,
      code,
      message: source.data?.error?.message || '生成服务暂时不可用，请稍后再试。',
    }
  }
}
