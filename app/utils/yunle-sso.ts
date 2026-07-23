// SSO 协议（URL 构造 / 消息校验）已交给官方包 @yunlefun/sso；这里只保留把 CloudBase
// session.user 映射为本地展示用户的逻辑。
export const defaultYunleSsoOrigin = 'https://www.yunle.fun'

export interface YunleSessionUser {
  id?: string
  uid?: string
  sub?: string
  username?: string
  name?: string
  nickName?: string
  picture?: string
  email?: string | null
  phone?: string | null
  phone_number?: string | null
  role?: string[] | string
  created_at?: string
  updated_at?: string
  providers?: Array<string | { id?: string }>
  is_anonymous?: boolean
  user_metadata?: Record<string, unknown>
  app_metadata?: {
    providers?: string[]
  }
}

export interface YunleSsoSession {
  user?: YunleSessionUser
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

/** 把 CloudBase session.user 映射为本地展示用户（头像/昵称取自 user_metadata） */
export function mapYunleSsoSession(session?: YunleSsoSession): YunleUser | null {
  const source = session?.user
  const id = readString(source?.id) || readString(source?.uid) || readString(source?.sub)
  if (!source || !id)
    return null

  const metadata = source.user_metadata
  const login = readMetadataString(metadata, ['username', 'login']) || readString(source.username)
  const nickname = readMetadataString(metadata, ['nickName', 'name', 'username'])
    || readString(source.nickName)
    || readString(source.name)
    || login
  const avatar = readMetadataString(metadata, ['avatarUrl', 'picture', 'avatar']) || readString(source.picture)
  const role = Array.isArray(source.role) ? source.role[0] : readString(source.role)
  const providers = source.app_metadata?.providers
    || source.providers?.map(provider => typeof provider === 'string' ? provider : readString(provider.id)).filter(Boolean)
    || []

  return {
    id,
    login,
    nickname,
    avatar,
    email: readString(source.email),
    phone: readString(source.phone) || readString(source.phone_number),
    role: role || 'USER',
    providers,
  }
}
