import { readProviderString } from '../../app/utils/ai-provider'
import { parseBearerToken } from '../../packages/server/bearer'
import { runPaidGeneration } from '../../packages/server/billing'
import { deductCloudbaseCoin, generateCoupletsViaCloudbase, getCloudbaseBalance } from '../../packages/server/cloudbase'

/**
 * EdgeOne Pages Function：登录扣云币生成春联（POST /api/generate）。
 *
 * 线上部署在 EdgeOne Pages，不跑 Nitro，故服务端逻辑以 Web 标准 onRequest 落地；
 * 与 Nitro `server/api/generate.ts`（本地 `pnpm dev` 用）共用 `packages/server` 的计费/CloudBase 编排。
 * 用「用户自己的」CloudBase access_token HTTP 直调，0 服务端密钥。env 缺省即用默认值，无需在控制台配置。
 */
interface EdgeContext {
  request: Request
  env: Record<string, string | undefined>
}

const APP_ID = 'ai-sfc'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function onRequest({ request, env }: EdgeContext): Promise<Response> {
  if (request.method !== 'POST')
    return json({ message: '请用 POST 调用。' }, 405)

  let body: { prompt?: unknown, bizId?: unknown }
  try {
    body = await request.json() as { prompt?: unknown, bizId?: unknown }
  }
  catch {
    body = {}
  }

  const prompt = readProviderString(body.prompt)
  if (!prompt)
    return json({ message: '请输入春联提示词。' }, 400)

  const envId = readProviderString(env.NUXT_PUBLIC_CLOUDBASE_ENV_ID) || 'yunlefun-8g7ybcxc7345c490'
  const group = readProviderString(env.NUXT_CLOUDBASE_MODEL_GROUP) || 'custom-deepseek-open'
  const model = readProviderString(env.NUXT_CLOUDBASE_MODEL) || 'deepseek-v4-flash'
  const cost = Math.max(1, Math.round(Number(env.NUXT_COST_PER_GENERATION) || 1))

  const token = parseBearerToken(request.headers.get('authorization'))
  const bizId = readProviderString(body.bizId) || crypto.randomUUID()

  const result = await runPaidGeneration(
    { token, prompt, bizId, cost },
    {
      getBalance: t => getCloudbaseBalance(envId, t),
      generate: (t, input) => generateCoupletsViaCloudbase(envId, t, group, model, input),
      deduct: (t, params) => deductCloudbaseCoin(envId, t, { appId: APP_ID, amount: params.amount, bizId: params.bizId }),
    },
  )

  if (!result.ok)
    return json({ message: result.message }, result.statusCode)

  return json({ ...result.couplets, balance: result.balance })
}
