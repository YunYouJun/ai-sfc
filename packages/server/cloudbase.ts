import { $fetch } from 'ofetch'

/**
 * 用「登录用户的 CloudBase access_token」HTTP 调 CloudBase（无需 admin 密钥，0 服务端密钥）。
 * 复用 yunle 登录态接口：
 *   - account-api 的 getAccount（查云币余额，余额 UI 用）；
 *   - ai-gateway 的 chat（计费 + 受控生成，付费生成主链路）。
 *
 * ⚠️ AI 不再由本侧用用户 token 直调（旧 `generateCoupletsViaCloudbase` 即白嫖洞，已移除）：
 * 生成统一经 yunle ai-gateway 云函数，由其以管理员身份调 AI 并原子扣费，端用户 token
 * 在网关侧对 `ai` 资源被 deny、无法直打 /v1/ai/<group>。详见架构记忆 billing-byo-architecture。
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

/** ai-gateway 通用聊天消息（OpenAI 风格）；与具体业务无关 */
export interface GatewayChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** ai-gateway 计费生成结果：成功回 content/balance，业务失败回 code/message */
export type GatewayChatResult
  = | { ok: true, content: string, balance: number, deduped: boolean }
    | { ok: false, code: string, message: string }

/**
 * 经 yunle ai-gateway 云函数「计费 + 受控生成」（单次原子业务调用）。
 *
 * 网关内部完成：验登录 → 余额校验 → 管理员身份调 AI → 成功后扣费（bizId 幂等）。
 * 本侧只负责把已构造好的 messages 发过去、拿回纯文本 content——春联 prompt 构造与
 * 结果解析都不在这里（解耦：yunle 不认识"春联"）。
 */
export async function aiChatViaGateway(
  envId: string,
  token: string,
  params: { appId: string, messages: GatewayChatMessage[], bizId: string },
): Promise<GatewayChatResult> {
  return callCloudFunction<GatewayChatResult>(envId, token, 'ai-gateway', { action: 'chat', ...params })
}
