import { readProviderString } from '../../../app/utils/ai-provider'
import { parseBearerToken } from '../../../packages/server/bearer'
import { getCloudbaseBalance } from '../../../packages/server/cloudbase'

/**
 * EdgeOne Pages Function：查云币余额（GET /api/wallet/balance）。
 * 等价于 Nitro `server/api/wallet/balance.get.ts`（本地 `pnpm dev` 用）。未登录 → balance:null（前端显示 —）。
 */
interface EdgeContext {
  request: Request
  env: Record<string, string | undefined>
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function onRequest({ request, env }: EdgeContext): Promise<Response> {
  const envId = readProviderString(env.NUXT_PUBLIC_CLOUDBASE_ENV_ID) || 'yunlefun-8g7ybcxc7345c490'
  const costPerGeneration = Math.max(1, Math.round(Number(env.NUXT_COST_PER_GENERATION) || 1))

  const token = parseBearerToken(request.headers.get('authorization'))
  if (!envId || !token)
    return json({ balance: null, costPerGeneration })

  try {
    const balance = await getCloudbaseBalance(envId, token)
    return json({ balance, costPerGeneration })
  }
  catch {
    return json({ balance: null, costPerGeneration })
  }
}
