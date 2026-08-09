import type { SsoAuthorizationResult } from '@yunlefun/sso'
import { deriveSsoPkceChallenge } from '@yunlefun/sso/protocol'

const SSO_VALUE_RE = /^[\w-]{32,256}$/

export interface YunleAppAuthorizeRequest {
  clientId: string
  redirectUri: string
  scope: string[]
  nonce: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
  prompt: 'consent' | 'select_account'
}

export interface YunleAppBridge {
  inYunleApp: true
  canIUse: (method: string) => Promise<boolean>
  authorize: (request: YunleAppAuthorizeRequest) => Promise<unknown>
}

export type YunleAppAuthorizationResult
  = | { kind: 'unavailable' }
    | { kind: 'unsupported' }
    | { kind: 'denied' }
    | { kind: 'failed' }
    | { kind: 'authorized', authorization: SsoAuthorizationResult }

declare global {
  interface Window {
    ylf?: YunleAppBridge
  }
}

function readBridge(): YunleAppBridge | undefined {
  if (typeof window === 'undefined')
    return undefined
  const bridge = window.ylf
  return bridge?.inYunleApp === true
    && typeof bridge.canIUse === 'function'
    && typeof bridge.authorize === 'function'
    ? bridge
    : undefined
}

function hasYunleAppMarker(): boolean {
  return typeof window !== 'undefined' && window.ylf?.inYunleApp === true
}

function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  globalThis.crypto.getRandomValues(bytes)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    result += alphabet[first >> 2]
    result += alphabet[((first & 0b11) << 4) | ((second ?? 0) >> 4)]
    if (second !== undefined)
      result += alphabet[((second & 0b1111) << 2) | ((third ?? 0) >> 6)]
    if (third !== undefined)
      result += alphabet[third & 0b111111]
  }

  return result
}

function errorCode(cause: unknown): string {
  if (cause instanceof Error)
    return cause.message
  return typeof cause === 'string' ? cause : ''
}

function isNativeAuthorizationResult(
  input: unknown,
  expectedIssuer: string,
): input is { ok: true, code: string, issuer: string } {
  if (!input || typeof input !== 'object')
    return false
  const result = input as Record<string, unknown>
  return result.ok === true
    && typeof result.code === 'string'
    && SSO_VALUE_RE.test(result.code)
    && result.issuer === expectedIssuer
}

/**
 * 在云乐坊 App 中请求宿主账号授权。只有普通浏览器（没有 App 标记）可继续走
 * Web PKCE Redirect；App 已注入但 authorize 不可用时必须提示升级，不能降级。
 */
export async function requestYunleAppAuthorization(
  options: {
    clientId: string
    redirectUri: string
    scope: string[]
    ssoOrigin: string
  },
  bridge = readBridge(),
  inYunleApp = bridge?.inYunleApp === true || hasYunleAppMarker(),
): Promise<YunleAppAuthorizationResult> {
  if (!bridge)
    return { kind: inYunleApp ? 'unsupported' : 'unavailable' }

  try {
    if (!await bridge.canIUse('authorize'))
      return { kind: 'unsupported' }
  }
  catch {
    return { kind: 'unsupported' }
  }

  try {
    const codeVerifier = randomBase64Url()
    const nonce = randomBase64Url()
    const codeChallenge = await deriveSsoPkceChallenge(codeVerifier)
    const request = {
      clientId: options.clientId,
      redirectUri: options.redirectUri,
      scope: options.scope,
      nonce,
      codeChallenge,
      codeChallengeMethod: 'S256' as const,
      prompt: 'consent' as const,
    }

    let result: unknown
    try {
      result = await bridge.authorize(request)
    }
    catch (cause) {
      const code = errorCode(cause)
      if (code.includes('HOST_AUTH_DENIED'))
        return { kind: 'denied' }
      if (!code.includes('HOST_AUTH_REQUIRED'))
        return { kind: 'failed' }
      result = await bridge.authorize({
        ...request,
        prompt: 'select_account',
      })
    }

    if (!isNativeAuthorizationResult(result, options.ssoOrigin))
      return { kind: 'failed' }

    return {
      kind: 'authorized',
      authorization: {
        ok: true,
        code: result.code,
        issuer: result.issuer,
        clientId: options.clientId,
        scope: options.scope,
        redirectUri: options.redirectUri,
        nonce,
        codeVerifier,
      },
    }
  }
  catch (cause) {
    return errorCode(cause).includes('HOST_AUTH_DENIED')
      ? { kind: 'denied' }
      : { kind: 'failed' }
  }
}
