import type { H3Event } from 'h3'
import { getHeader } from 'h3'

/** 从请求头读取 Bearer token（CloudBase access_token） */
export function readBearerToken(event: H3Event): string | null {
  const authorization = getHeader(event, 'authorization')
  if (!authorization)
    return null

  const match = /^Bearer\s+(\S.*)$/i.exec(authorization.trim())
  return match?.[1] ?? null
}
