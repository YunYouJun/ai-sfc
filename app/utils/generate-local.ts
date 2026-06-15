import type { AiProviderRequest } from './ai-provider'
import type { ApiGenerateResult } from './api'
// ⚠️ 仅从同构子模块引入，切勿 import 包入口 `~~/packages/ai/src`（其会执行 cli 的 main()）
import { buildCoupletMessages, parseCoupletContent } from '~~/packages/ai/src/couplets'
import { config } from '~/config'
import { defaultAiBaseURL, defaultAiModel } from './ai-provider'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

/**
 * 浏览器「直连」兼容 OpenAI 协议的模型接口生成春联。
 * token 仅取自本地设置，请求直接发往用户填写的 baseURL，**不经过本站服务端**。
 */
export async function generateCoupletsDirect(
  prompt: string,
  provider: AiProviderRequest,
): Promise<ApiGenerateResult> {
  const baseURL = trimTrailingSlash(provider.baseURL || defaultAiBaseURL)
  const model = provider.model || defaultAiModel
  const apiKey = provider.apiKey || ''

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildCoupletMessages(prompt, config.inputMaxLength),
        max_tokens: 100,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return {
        ok: false,
        statusCode: res.status,
        message: `模型接口请求失败（${res.status}）${detail ? `：${detail.slice(0, 160)}` : ''}`,
      }
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
    }
    const couplets = parseCoupletContent(data.choices?.[0]?.message?.content)
    if (!couplets)
      return { ok: false, message: '模型返回内容无法解析为春联，请调整提示词重试。' }

    return { ok: true, couplets }
  }
  catch (error: any) {
    console.error('generateCoupletsDirect', error)
    return { ok: false, message: error?.message || '模型接口请求失败，请检查接口地址与网络。' }
  }
}
