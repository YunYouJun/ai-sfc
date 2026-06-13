export const defaultYunleSsoOrigin = 'https://www.yunle.fun'
export const yunleSsoPath = '/auth/sso'

export type YunleSsoMode = 'silent' | 'interactive'

export interface YunleSessionUser {
  id?: string
  email?: string | null
  phone?: string | null
  role?: string[] | string
  created_at?: string
  updated_at?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: {
    providers?: string[]
  }
}

export interface YunleSsoSession {
  user?: YunleSessionUser
}

export interface YunleSsoMessage {
  type?: 'ylf:sso-result'
  ok?: boolean
  nonce?: string
  reason?: string
  session?: YunleSsoSession
}

export interface YunleUser {
  id: string
  login: string
  nickname: string
  avatar: string
  email: string
  phone: string
  role: string
  providers: string[]
}

export function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function readMetadataString(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = readString(metadata?.[key])
    if (value)
      return value
  }
  return ''
}

export function mapYunleSsoSession(session?: YunleSsoSession): YunleUser | null {
  const source = session?.user
  if (!source?.id)
    return null

  const metadata = source.user_metadata
  const login = readMetadataString(metadata, ['username', 'login'])
  const nickname = readMetadataString(metadata, ['nickName', 'name', 'username'])
  const avatar = readMetadataString(metadata, ['avatarUrl', 'picture', 'avatar'])
  const role = Array.isArray(source.role) ? source.role[0] : readString(source.role)

  return {
    id: source.id,
    login,
    nickname,
    avatar,
    email: readString(source.email),
    phone: readString(source.phone),
    role: role || 'USER',
    providers: source.app_metadata?.providers || [],
  }
}

export function buildYunleSsoUrl(options: {
  mode: YunleSsoMode
  nonce: string
  ssoOrigin: string
  targetOrigin: string
}) {
  const url = new URL(yunleSsoPath, trimTrailingSlash(options.ssoOrigin))
  url.searchParams.set('mode', options.mode)
  url.searchParams.set('targetOrigin', options.targetOrigin)
  url.searchParams.set('nonce', options.nonce)
  return url.toString()
}

export function isExpectedYunleSsoMessage(options: {
  data: unknown
  eventOrigin: string
  expectedNonce: string
  expectedOrigin: string
}): options is {
  data: YunleSsoMessage
  eventOrigin: string
  expectedNonce: string
  expectedOrigin: string
} {
  if (options.eventOrigin !== options.expectedOrigin)
    return false

  const data = options.data as YunleSsoMessage
  return data?.type === 'ylf:sso-result' && data.nonce === options.expectedNonce
}
