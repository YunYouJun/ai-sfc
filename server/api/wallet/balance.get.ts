import { readProviderString } from '../../../app/utils/ai-provider'
import { callAccountApi, getCloudbaseApp } from '../../../packages/server/cloudbase'
import { readBearerToken, verifyCloudBaseToken } from '../../../packages/server/identity'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event) as Record<string, unknown>
  const envId = readProviderString(runtimeConfig.cloudbaseEnvId)
  const secretId = readProviderString(runtimeConfig.tencentApiSecretId)
  const secretKey = readProviderString(runtimeConfig.tencentApiSecretKey)
  const internalToken = readProviderString(runtimeConfig.accountApiInternalToken)
  const costPerGeneration = Math.max(1, Math.round(Number(runtimeConfig.costPerGeneration) || 1))

  // 未配置 CloudBase / 未登录 → 余额未知（前端不显示）
  if (!(envId && secretId && secretKey && internalToken))
    return { balance: null, costPerGeneration }

  const token = readBearerToken(event)
  if (!token)
    return { balance: null, costPerGeneration }

  const user = await verifyCloudBaseToken(envId, token)
  if (!user)
    return { balance: null, costPerGeneration }

  try {
    const app = getCloudbaseApp({ envId, secretId, secretKey })
    const res = await callAccountApi<{ coin?: number, balance?: number }>(app, 'getAccountForUser', {
      serviceToken: internalToken,
      userId: user.id,
    })
    const balance = typeof res.coin === 'number'
      ? res.coin
      : (typeof res.balance === 'number' ? res.balance : null)
    return { balance, costPerGeneration }
  }
  catch (error) {
    // getAccountForUser 尚未在 yunle account-api 部署（未知 action）→ 降级返回 null
    console.error('[api/wallet/balance] getAccountForUser failed:', error instanceof Error ? error.message : error)
    return { balance: null, costPerGeneration }
  }
})
