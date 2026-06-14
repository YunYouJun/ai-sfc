import { $fetch } from 'ofetch'
import { buildCoupletMessages, parseCoupletContent } from '../ai/src/couplets'

/**
 * 用「登录用户的 CloudBase access_token」HTTP 直调 CloudBase（无需 admin 密钥）。
 * 复用 yunle 的登录态接口：account-api 的 getAccount/deductCoin、AI 大模型端点。
 */

function gatewayBase(envId: string) {
  return `https://${envId}.api.tcloudbasegateway.com`
}

/** 调用 CloudBase 云函数（登录态）；兼容返回值包 { result } 或直接返回两种形态 */
export async function callCloudFunction<T = unknown>(
  envId: string,
  token: string,
  name: string,
  data: Record<string, unknown>,
): Promise<T> {
  const res = await $fetch<unknown>(`${gatewayBase(envId)}/v1/functions/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  })
  if (res && typeof res === 'object' && 'result' in res)
    return (res as { result: T }).result
  return res as T
}

/** 查云币余额（account-api getAccount，登录态） */
export async function getCloudbaseBalance(envId: string, token: string): Promise<number> {
  const account = await callCloudFunction<{ coin?: number }>(envId, token, 'account-api', { action: 'getAccount' })
  return typeof account?.coin === 'number' ? account.coin : 0
}

/** 扣云币（account-api deductCoin，登录态，bizId 幂等） */
export async function deductCloudbaseCoin(
  envId: string,
  token: string,
  params: { appId: string, amount: number, bizId: string },
): Promise<{ balance: number, deduped: boolean }> {
  return callCloudFunction<{ balance: number, deduped: boolean }>(envId, token, 'account-api', { action: 'deductCoin', ...params })
}

/** 用 CloudBase AI（OpenAI 兼容 HTTP 端点）生成春联 */
export async function generateCoupletsViaCloudbase(
  envId: string,
  token: string,
  group: string,
  model: string,
  prompt: string,
) {
  const res = await $fetch<{ choices?: { message?: { content?: string } }[] }>(
    `${gatewayBase(envId)}/v1/ai/${group}/chat/completions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { model, stream: false, messages: buildCoupletMessages(prompt) },
    },
  )
  return parseCoupletContent(res.choices?.[0]?.message?.content)
}
