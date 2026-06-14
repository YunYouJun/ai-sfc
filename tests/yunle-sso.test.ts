import { describe, expect, it } from 'vitest'
import {
  buildYunleSsoUrl,
  defaultYunleSsoOrigin,
  isExpectedYunleSsoMessage,
  mapYunleSsoSession,
  readSsoAccessToken,
  trimTrailingSlash,
} from '../app/utils/yunle-sso'

describe('yunle sso helpers', () => {
  it('应该构造带 targetOrigin 与 nonce 的 SSO URL', () => {
    const url = new URL(buildYunleSsoUrl({
      mode: 'interactive',
      nonce: 'nonce-1',
      ssoOrigin: `${defaultYunleSsoOrigin}/`,
      targetOrigin: 'https://ai-sfc.yunyoujun.cn',
    }))

    expect(url.origin).toBe(defaultYunleSsoOrigin)
    expect(url.pathname).toBe('/auth/sso')
    expect(url.searchParams.get('mode')).toBe('interactive')
    expect(url.searchParams.get('nonce')).toBe('nonce-1')
    expect(url.searchParams.get('targetOrigin')).toBe('https://ai-sfc.yunyoujun.cn')
  })

  it('应该只接受来源和 nonce 均匹配的 SSO 消息', () => {
    const data = {
      type: 'ylf:sso-result',
      ok: true,
      nonce: 'nonce-1',
    }

    expect(isExpectedYunleSsoMessage({
      data,
      eventOrigin: defaultYunleSsoOrigin,
      expectedNonce: 'nonce-1',
      expectedOrigin: defaultYunleSsoOrigin,
    })).toBe(true)

    expect(isExpectedYunleSsoMessage({
      data,
      eventOrigin: 'https://evil.example',
      expectedNonce: 'nonce-1',
      expectedOrigin: defaultYunleSsoOrigin,
    })).toBe(false)

    expect(isExpectedYunleSsoMessage({
      data,
      eventOrigin: defaultYunleSsoOrigin,
      expectedNonce: 'nonce-2',
      expectedOrigin: defaultYunleSsoOrigin,
    })).toBe(false)
  })

  it('应该把云乐坊 session 映射为本地展示用户', () => {
    const user = mapYunleSsoSession({
      user: {
        id: 'user-1',
        email: 'hi@yunle.fun',
        role: ['ADMIN'],
        user_metadata: {
          username: 'yyj',
          nickName: '云游君',
          avatarUrl: 'https://example.com/avatar.png',
        },
        app_metadata: {
          providers: ['github'],
        },
      },
    })

    expect(user).toEqual({
      id: 'user-1',
      login: 'yyj',
      nickname: '云游君',
      avatar: 'https://example.com/avatar.png',
      email: 'hi@yunle.fun',
      phone: '',
      role: 'ADMIN',
      providers: ['github'],
    })
  })

  it('应该拒绝缺少用户 id 的 session', () => {
    expect(mapYunleSsoSession({ user: { user_metadata: { username: 'yyj' } } })).toBeNull()
  })

  it('应该去除 SSO origin 末尾斜杠', () => {
    expect(trimTrailingSlash('https://www.yunle.fun///')).toBe('https://www.yunle.fun')
  })

  it('应该从 CloudBase session 读取 access_token', () => {
    expect(readSsoAccessToken({ access_token: 'tok_123' })).toBe('tok_123')
    expect(readSsoAccessToken({})).toBe('')
    expect(readSsoAccessToken(undefined)).toBe('')
  })
})
