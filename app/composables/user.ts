import type { SsoFailureReason } from '@yunlefun/sso'
import type { YunleSessionUser, YunleUser } from '~/utils/yunle-sso'
import { useStorage } from '@vueuse/core'
import {
  adoptSsoCode,
  consumeSsoRedirect,
  hasSsoRedirectResult,
  startSsoRedirect,
} from '@yunlefun/sso'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  defaultYunleSsoOrigin,
  mapYunleSsoSession,
  readString,
  trimTrailingSlash,
} from '~/utils/yunle-sso'

const ns = 'ai-sfc'

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

  async function restoreCloudbaseSession(): Promise<YunleUser | null> {
    const auth = useCloudbaseAuth()
    if (!auth)
      return user.value

    const { data, error: sessionError } = await auth.getSession()
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
        status.value = user.value ? 'authenticated' : 'error'
        error.value = '登录校验信息已失效，请重新登录'
        return user.value
      }
      if (redirect && !redirect.ok) {
        status.value = user.value ? 'authenticated' : 'error'
        error.value = ssoFailMessage(redirect.reason)
        return user.value
      }

      if (redirect?.ok) {
        const auth = useCloudbaseAuth()
        const adopted = auth && await adoptSsoCode(auth, redirect, {
          exchangeUrl: ssoExchangeUrl.value,
        })
        if (!adopted)
          throw new Error('SSO code adoption failed')
      }

      return await restoreCloudbaseSession()
    })().catch(() => {
      status.value = user.value ? 'authenticated' : 'error'
      error.value = '云乐坊登录状态同步失败'
      return user.value
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
      await startSsoRedirect({
        clientId: ssoClientId.value,
        scope: ['identity:bootstrap'],
        redirectUri: ssoRedirectUri.value,
        ssoOrigin: ssoOrigin.value,
      })
    }
    catch {
      status.value = user.value ? 'authenticated' : 'error'
      error.value = '无法跳转到云乐坊登录页'
    }
    return user.value
  }

  async function refresh() {
    return syncSilently()
  }

  async function logout() {
    const auth = useCloudbaseAuth()
    try {
      await auth?.signOut()
    }
    catch {}
    clearUser('idle')
    error.value = ''
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
    getAccessToken,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
