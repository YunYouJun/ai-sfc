import { readProviderString } from '../../../app/utils/ai-provider'
import { getCloudbaseBalance } from '../../../packages/server/cloudbase'
import { readBearerToken } from '../../../packages/server/identity'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event) as Record<string, unknown>
  const pub = (runtimeConfig.public ?? {}) as Record<string, unknown>
  const envId = readProviderString(pub.cloudbaseEnvId)
  const costPerGeneration = Math.max(1, Math.round(Number(runtimeConfig.costPerGeneration) || 1))

  const token = readBearerToken(event)
  // 未配 envId / 未登录 → 余额未知（前端显示 —）
  if (!envId || !token)
    return { balance: null, costPerGeneration }

  try {
    const balance = await getCloudbaseBalance(envId, token)
    return { balance, costPerGeneration }
  }
  catch (error) {
    console.error('[api/wallet/balance] getAccount failed:', error instanceof Error ? error.message : error)
    return { balance: null, costPerGeneration }
  }
})
