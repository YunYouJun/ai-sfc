import type { SsoAuthorizationResult, SsoFailureReason } from '@yunlefun/sso'
import type { YunleSessionUser, YunleUser } from '~/utils/yunle-sso'
import { useStorage } from '@vueuse/core'
import {
  adoptSsoCode,
  consumeSsoRedirect,
  hasSsoRedirectResult,
  startSsoRedirect,
} from '@yunlefun/sso'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { withTimeout } from '~/utils/promise-timeout'
import { requestYunleAppAuthorization } from '~/utils/yunle-app-sso'
import {
  defaultYunleSsoOrigin,
  mapYunleSsoSession,
  readString,
  trimTrailingSlash,
} from '~/utils/yunle-sso'

const ns = 'ai-sfc'
const SILENT_SESSION_TIMEOUT_MS = 5_000
const INTERACTIVE_AUTH_TIMEOUT_MS = 15_000

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'anonymous' | 'error'

function ssoFailMessage(reason: SsoFailureReason): string {
  switch (reason) {
    case 'access_denied':
      return '已取消云乐坊登录授权'
    case 'invalid_request':
      return '登录请求已失效，请重试'
    case 'not_authenticated':
      return '尚未登录云乐坊'
    case 'server_error':
      return '云乐坊登录服务暂时不可用，请稍后重试'
  }
}

export const useUserStore = defineStore('user', () => {
  const runtimeConfig = useRuntimeConfig()
  const user = useStorage<YunleUser | null>(`${ns}:yunle-user`, null)
  const lastSyncedAt = useStorage(`${ns}:yunle-user-synced-at`, 0)
  const status = shallowRef<AuthStatus>(user.value ? 'authenticated' : 'idle')
  const error = shallowRef('')
  let pendingSync: Promise<YunleUser | null> | null = null
  let pendingAdoption: {
    abandoned: boolean
    controller: AbortController
    promise: Promise<boolean>
  } | null = null

  const ssoOrigin = computed(() =>
    trimTrailingSlash(readString(runtimeConfig.public.yunleSsoOrigin) || defaultYunleSsoOrigin),
  )
  const ssoClientId = computed(() =>
    readString(runtimeConfig.public.yunleSsoClientId) || 'ai-sfc-web',
  )
  const ssoExchangeUrl = computed(() =>
    readString(runtimeConfig.public.yunleSsoExchangeUrl) || 'https://api.yunle.fun/sso-ticket',
  )
  const ssoRedirectUri = computed(() => {
    const configured = readString(runtimeConfig.public.yunleSsoRedirectUri)
    if (configured)
      return configured
    return import.meta.client ? new URL('/', window.location.origin).toString() : ''
  })
  const loading = computed(() => status.value === 'checking')
  const isAuthenticated = computed(() => !!user.value)
  const displayName = computed(() => user.value?.nickname || user.value?.login || '云乐坊用户')
  const accountLabel = computed(() => {
    if (loading.value)
      return '同步中'
    if (user.value)
      return displayName.value
    if (status.value === 'error')
      return '同步失败'
    return '登录'
  })

  function getYunleUrl(path = '/') {
    return new URL(path, `${ssoOrigin.value}/`).toString()
  }

  function clearUser(nextStatus: AuthStatus) {
    user.value = null
    lastSyncedAt.value = 0
    status.value = nextStatus
  }

  function abandonPendingAdoption() {
    if (!pendingAdoption)
      return
    pendingAdoption.abandoned = true
    pendingAdoption.controller.abort()
  }

  /**
   * 一次只允许一个 code adoption。超时会中止 code exchange，并在迟到的 SDK
   * 操作最终结束后再次登出；在它完成前拒绝重试，避免旧操作覆盖新会话。
   */
  async function adoptAuthorization(
    auth: NonNullable<ReturnType<typeof useCloudbaseAuth>>,
    authorization: SsoAuthorizationResult,
    timeoutMessage: string,
  ): Promise<boolean> {
    if (pendingAdoption)
      throw new Error('Previous SSO code adoption is still finishing')

    const controller = new AbortController()
    const state = {
      abandoned: false,
      controller,
      promise: Promise.resolve(false),
    }
    const operation = adoptSsoCode(auth, authorization, {
      exchangeUrl: ssoExchangeUrl.value,
      fetch: (input, init) => globalThis.fetch(input, {
        ...init,
        signal: controller.signal,
      }),
    })
    state.promise = operation.then(
      async (adopted) => {
        if (state.abandoned) {
          try {
            await auth.signOut()
          }
          catch {}
          return false
        }
        return adopted
      },
      async (cause) => {
        if (state.abandoned) {
          try {
            await auth.signOut()
          }
          catch {}
        }
        throw cause
      },
    ).finally(() => {
      if (pendingAdoption === state)
        pendingAdoption = null
    })
    pendingAdoption = state

    try {
      return await withTimeout(
        state.promise,
        INTERACTIVE_AUTH_TIMEOUT_MS,
        timeoutMessage,
        () => {
          state.abandoned = true
          controller.abort()
        },
      )
    }
    catch (cause) {
      state.abandoned = true
      controller.abort()
      void auth.signOut().catch(() => undefined)
      throw cause
    }
  }

  async function restoreCloudbaseSession(
    timeoutMs = SILENT_SESSION_TIMEOUT_MS,
  ): Promise<YunleUser | null> {
    const auth = useCloudbaseAuth()
    if (!auth)
      return user.value

    const { data, error: sessionError } = await withTimeout(
      auth.getSession(),
      timeoutMs,
      'CloudBase session restore timed out',
    )
    const session = data?.session
    if (sessionError || !session || session.user?.is_anonymous) {
      clearUser('anonymous')
      return null
    }

    const nextUser = mapYunleSsoSession({
      user: session.user as YunleSessionUser,
    })
    if (!nextUser) {
      clearUser('error')
      error.value = '云乐坊账号信息不完整'
      return null
    }

    user.value = nextUser
    lastSyncedAt.value = Date.now()
    status.value = 'authenticated'
    return user.value
  }

  /**
   * 消费 SSO 顶层重定向结果，或恢复本站已有的 CloudBase 会话。
   * 保留旧方法名以兼容现有调用；这里不再发起跨站 iframe 静默登录。
   */
  async function syncSilently() {
    if (!import.meta.client)
      return user.value
    if (pendingSync)
      return pendingSync

    pendingSync = (async () => {
      status.value = 'checking'
      error.value = ''

      const hasRedirectResult = hasSsoRedirectResult(window.location.hash)
      const redirect = consumeSsoRedirect()
      if (hasRedirectResult && !redirect) {
        clearUser('error')
        error.value = '登录校验信息已失效，请重新登录'
        return null
      }
      if (redirect && !redirect.ok) {
        clearUser('error')
        error.value = ssoFailMessage(redirect.reason)
        return null
      }

      if (redirect?.ok) {
        const auth = useCloudbaseAuth()
        const adopted = auth && await adoptAuthorization(
          auth,
          redirect,
          'SSO code adoption timed out',
        )
        if (!adopted)
          throw new Error('SSO code adoption failed')
      }

      // 回调必须先消费；只有完全没有回调时，App 首屏才等待用户主动授权。
      if (window.ylf?.inYunleApp && !user.value && !redirect) {
        clearUser('anonymous')
        return null
      }

      return await restoreCloudbaseSession()
    })().catch(() => {
      clearUser('error')
      error.value = '云乐坊登录状态同步失败'
      return null
    }).finally(() => {
      pendingSync = null
    })

    return pendingSync
  }

  async function login() {
    if (!import.meta.client)
      return user.value

    status.value = 'checking'
    error.value = ''
    try {
      const native = await requestYunleAppAuthorization({
        clientId: ssoClientId.value,
        scope: ['identity:bootstrap'],
        redirectUri: ssoRedirectUri.value,
        ssoOrigin: ssoOrigin.value,
      })
      if (native.kind === 'denied') {
        status.value = user.value ? 'authenticated' : 'error'
        error.value = '已取消云乐坊登录授权'
        return user.value
      }
      if (native.kind === 'failed') {
        status.value = user.value ? 'authenticated' : 'error'
        error.value = '云乐坊 App 授权失败，请重试'
        return user.value
      }
      if (native.kind === 'unsupported') {
        status.value = user.value ? 'authenticated' : 'error'
        error.value = '当前云乐坊 App 版本不支持账号授权，请升级后重试'
        return user.value
      }
      if (native.kind === 'authorized') {
        const auth = useCloudbaseAuth()
        const adopted = auth && await adoptAuthorization(
          auth,
          native.authorization,
          'Native SSO code adoption timed out',
        )
        if (!adopted)
          throw new Error('Native SSO code adoption failed')
        return await restoreCloudbaseSession(INTERACTIVE_AUTH_TIMEOUT_MS)
      }

      await startSsoRedirect({
        clientId: ssoClientId.value,
        scope: ['identity:bootstrap'],
        redirectUri: ssoRedirectUri.value,
        ssoOrigin: ssoOrigin.value,
      })
    }
    catch {
      clearUser('error')
      error.value = window.ylf?.inYunleApp
        ? '云乐坊 App 登录状态同步失败'
        : '无法跳转到云乐坊登录页'
    }
    return user.value
  }

  async function refresh() {
    return syncSilently()
  }

  async function logout() {
    abandonPendingAdoption()
    const auth = useCloudbaseAuth()
    try {
      await auth?.signOut()
    }
    catch {}
    clearUser('idle')
    error.value = ''
  }

  async function handleHostIdentityChanged() {
    abandonPendingAdoption()
    const auth = useCloudbaseAuth()
    try {
      await auth?.signOut()
    }
    catch {}
    clearUser('anonymous')
    error.value = '云乐坊账号已切换，请重新授权登录'
  }

  /** 取当前 access_token（CloudBase SDK 自动续期）；未登录或失效返回空串 */
  async function getAccessToken(): Promise<string> {
    const auth = useCloudbaseAuth()
    if (!auth)
      return ''
    try {
      const res = await auth.getAccessToken()
      return res?.accessToken ?? ''
    }
    catch {
      return ''
    }
  }

  return {
    user,
    status,
    error,
    loading,
    isAuthenticated,
    displayName,
    accountLabel,
    getYunleUrl,
    syncSilently,
    login,
    refresh,
    logout,
    handleHostIdentityChanged,
    getAccessToken,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
