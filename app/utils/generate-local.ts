import type { SprintFestivalCouplets } from '~~/packages/ai/src/couplets'
import type { AiProviderRequest } from './ai-provider'
// ⚠️ 仅从同构子模块引入，切勿 import 包入口 `~~/packages/ai/src`（其会执行 cli 的 main()）
import { buildCoupletMessages, parseCoupletContent } from '~~/packages/ai/src/couplets'
import { config } from '~/config'
import { defaultAiBaseURL, defaultAiModel } from './ai-provider'

export type LocalGenerateResult = SprintFestivalCouplets & { error?: string }

const fallbackCouplets: SprintFestivalCouplets = {
  上联: '网络出错网络差',
  下联: '热门火爆排队多',
  横批: '掉线断网',
  总结: '寄',
}

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
): Promise<LocalGenerateResult> {
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
      throw new Error(`模型接口请求失败（${res.status}）${detail ? `：${detail.slice(0, 160)}` : ''}`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    const coupletData = parseCoupletContent(content)

    if (!coupletData)
      throw new Error('模型返回内容无法解析为春联。')

    return coupletData
  }
  catch (error: any) {
    console.error('generateCoupletsDirect', error)
    return {
      ...fallbackCouplets,
      error: error?.message || '模型接口请求失败',
    }
  }
}
