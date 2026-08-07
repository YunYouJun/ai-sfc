import type { YunleAppBridge } from '../app/utils/yunle-app-sso'
import { describe, expect, it, vi } from 'vitest'
import { requestYunleAppAuthorization } from '../app/utils/yunle-app-sso'

const options = {
  clientId: 'ai-sfc-web',
  redirectUri: 'https://ai-sfc.yunle.fun/',
  scope: ['identity:bootstrap'],
  ssoOrigin: 'https://www.yunle.fun',
}

function createBridge(authorize: YunleAppBridge['authorize']): YunleAppBridge {
  return {
    inYunleApp: true,
    canIUse: vi.fn().mockResolvedValue(true),
    authorize,
  }
}

describe('yunle app native sso', () => {
  it('uses consent and returns a complete PKCE authorization result', async () => {
    const authorize = vi.fn().mockResolvedValue({
      ok: true,
      code: 'c'.repeat(43),
      issuer: 'https://www.yunle.fun',
    })
    const result = await requestYunleAppAuthorization(options, createBridge(authorize))

    expect(result.kind).toBe('authorized')
    expect(authorize).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'ai-sfc-web',
      redirectUri: 'https://ai-sfc.yunle.fun/',
      scope: ['identity:bootstrap'],
      codeChallengeMethod: 'S256',
      prompt: 'consent',
    }))
    expect(authorize.mock.calls[0]?.[0].nonce).toMatch(/^[\w-]{43}$/)
    expect(authorize.mock.calls[0]?.[0].codeChallenge).toMatch(/^[\w-]{43}$/)
    if (result.kind === 'authorized')
      expect(result.authorization.codeVerifier).toMatch(/^[\w-]{43}$/)
  })

  it('opens system account selection when the host has no current session', async () => {
    const authorize = vi.fn()
      .mockRejectedValueOnce(new Error('HOST_AUTH_REQUIRED'))
      .mockResolvedValueOnce({
        ok: true,
        code: 'c'.repeat(43),
        issuer: 'https://www.yunle.fun',
      })

    expect((await requestYunleAppAuthorization(options, createBridge(authorize))).kind)
      .toBe('authorized')
    expect(authorize).toHaveBeenNthCalledWith(2, expect.objectContaining({
      prompt: 'select_account',
    }))
  })

  it('does not downgrade a user denial to Web redirect', async () => {
    const bridge = createBridge(vi.fn().mockRejectedValue(new Error('HOST_AUTH_DENIED')))
    expect(await requestYunleAppAuthorization(options, bridge)).toEqual({ kind: 'denied' })
  })

  it('lets callers use Web redirect only when the native API is unavailable', async () => {
    const bridge = createBridge(vi.fn())
    vi.mocked(bridge.canIUse).mockResolvedValue(false)
    expect(await requestYunleAppAuthorization(options, bridge)).toEqual({ kind: 'unavailable' })
    expect(bridge.authorize).not.toHaveBeenCalled()
  })

  it('rejects a code returned for another issuer', async () => {
    const bridge = createBridge(vi.fn().mockResolvedValue({
      ok: true,
      code: 'c'.repeat(43),
      issuer: 'https://evil.example',
    }))
    expect(await requestYunleAppAuthorization(options, bridge)).toEqual({ kind: 'failed' })
  })
})
