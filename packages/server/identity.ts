import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { $fetch } from 'ofetch'

export interface VerifiedCloudBaseUser {
  id: string
  email?: string | null
  phone?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readNullableString(value: unknown): string | null | undefined {
  return value === null ? null : readString(value)
}

function toVerifiedUser(value: unknown): VerifiedCloudBaseUser | null {
  if (!isRecord(value))
    return null

  const id = readString(value.id) ?? readString(value.uid) ?? readString(value.sub)
  if (!id)
    return null

  return {
    id,
    email: readNullableString(value.email),
    phone: readNullableString(value.phone),
  }
}

/** 从请求头读取 Bearer token */
export function readBearerToken(event: H3Event): string | null {
  const authorization = getHeader(event, 'authorization')
  if (!authorization)
    return null

  const match = /^Bearer\s+(\S.*)$/i.exec(authorization.trim())
  return match?.[1] ?? null
}

/**
 * 用 CloudBase access_token 换取可信用户身份。
 * 复用 yunle 的鉴权方式：转发给 CloudBase 的 /auth/v1/user/me。
 */
export async function verifyCloudBaseToken(envId: string, token: string): Promise<VerifiedCloudBaseUser | null> {
  try {
    const profile = await $fetch(`https://${envId}.api.tcloudbasegateway.com/auth/v1/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return toVerifiedUser(profile)
  }
  catch {
    return null
  }
}
