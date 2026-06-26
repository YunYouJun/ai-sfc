import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { parseBearerToken } from './bearer'

/** 从 h3 请求头读取 Bearer token（CloudBase access_token） */
export function readBearerToken(event: H3Event): string | null {
  return parseBearerToken(getHeader(event, 'authorization'))
}
