import { describe, expect, it } from 'vitest'
import { mapYunleSsoSession, trimTrailingSlash } from '../app/utils/yunle-sso'

describe('yunle sso helpers', () => {
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
})
