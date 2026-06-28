import { readProviderString } from '../../app/utils/ai-provider'
import { parseBearerToken } from '../../packages/server/bearer'
import { runPaidGeneration } from '../../packages/server/billing'
import { aiChatViaGateway } from '../../packages/server/cloudbase'

/**
 * EdgeOne Pages Function：登录扣云币生成春联（POST /api/generate）。
 *
 * 线上部署在 EdgeOne Pages，不跑 Nitro，故服务端逻辑以 Web 标准 onRequest 落地；
 * 与 Nitro `server/api/generate.ts`（本地 `pnpm dev` 用）共用 `packages/server` 的计费编排。
 *
 * 生成统一经 yunle ai-gateway 云函数（验登录 + 扣费 + 管理员身份调 AI），本侧 0 服务端密钥、
 * 也不再用用户 token 直调 AI（已堵白嫖洞）。模型 / 计价由 yunle 服务端按 appId 决定，本侧不配。
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
  const token = parseBearerToken(request.headers.get('authorization'))
  const bizId = readProviderString(body.bizId) || crypto.randomUUID()

  const result = await runPaidGeneration(
    { token, prompt, bizId },
    { chat: (t, messages, id) => aiChatViaGateway(envId, t, { appId: APP_ID, messages, bizId: id }) },
  )

  if (!result.ok)
    return json({ message: result.message }, result.statusCode)

  return json({ ...result.couplets, balance: result.balance })
}
