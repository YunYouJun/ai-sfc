import { $fetch } from 'ofetch'

/** 使用登录用户的 CloudBase access_token 读取 account-api 账户数据。 */

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
