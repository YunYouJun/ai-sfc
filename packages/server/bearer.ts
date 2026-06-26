/**
 * 从 Authorization 头解析 Bearer token（CloudBase access_token）。
 * 纯函数、零依赖，Node（h3 路由）与 V8 边缘运行时（EdgeOne 函数）通用。
 */
export function parseBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization)
    return null

  const match = /^Bearer\s+(\S.*)$/i.exec(authorization.trim())
  return match?.[1] ?? null
}
