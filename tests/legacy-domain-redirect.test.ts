import { describe, expect, it, vi } from 'vitest'
import { onRequest, shouldRedirectLegacyHost } from '../functions/_middleware'

describe('legacy production domains', () => {
  it('recognizes only the retired AI 春联 hosts', () => {
    expect(shouldRedirectLegacyHost('ai-sfc.yunyoujun.cn')).toBe(true)
    expect(shouldRedirectLegacyHost('preview.ai-sfc.pages.dev')).toBe(true)
    expect(shouldRedirectLegacyHost('ai-sfc.yunle.fun')).toBe(false)
    expect(shouldRedirectLegacyHost('evil-ai-sfc.pages.dev.example')).toBe(false)
  })

  it('preserves path and query in a permanent redirect', async () => {
    const next = vi.fn()
    const response = await onRequest({
      request: new Request('https://ai-sfc.yunyoujun.cn/history?from=old'),
      next,
    })
    expect(response.status).toBe(308)
    expect(response.headers.get('location'))
      .toBe('https://ai-sfc.yunle.fun/history?from=old')
    expect(next).not.toHaveBeenCalled()
  })

  it('continues normally on the primary host', async () => {
    const expected = new Response('ok')
    const next = vi.fn().mockResolvedValue(expected)
    await expect(onRequest({
      request: new Request('https://ai-sfc.yunle.fun/'),
      next,
    })).resolves.toBe(expected)
  })
})
