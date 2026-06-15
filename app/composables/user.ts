import type { SsoFailureReason } from '@yunlefun/sso/protocol'
import type { YunleSessionUser, YunleUser } from '~/utils/yunle-sso'
import { useStorage } from '@vueuse/core'
import { signInWithSso } from '@yunlefun/sso'
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
    case 'popup_blocked':
      return '浏览器拦截了登录窗口，请允许弹窗后重试'
    case 'closed':
      return '已取消登录'
    case 'timeout':
      return '云乐坊账号同步超时'
    default:
      return '云乐坊账号同步失败'
  }
}

export const useUserStore = defineStore('user', () => {
  const runtimeConfig = useRuntimeConfig()
  const user = useStorage<YunleUser | null>(`${ns}:yunle-user`, null)
  const lastSyncedAt = useStorage(`${ns}:yunle-user-synced-at`, 0)
  const status = shallowRef<AuthStatus>(user.value ? 'authenticated' : 'idle')
  const error = shallowRef('')
  let pendingSilent: Promise<YunleUser | null> | null = null

  const ssoOrigin = computed(() =>
    trimTrailingSlash(readString(runtimeConfig.public.yunleSsoOrigin) || defaultYunleSsoOrigin),
  )
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
    return '云乐坊登录'
  })

  function getYunleUrl(path = '/') {
    return new URL(path, `${ssoOrigin.value}/`).toString()
  }

  /** 用 @yunlefun/sso 发起登录（silent 静默 / interactive 弹窗），成功后由它注入 CloudBase 登录态 */
  async function runSso(mode: 'silent' | 'interactive'): Promise<YunleUser | null> {
    const auth = useCloudbaseAuth()
    if (!auth)
      return user.value

    status.value = 'checking'
    error.value = ''

    const res = await signInWithSso(auth, { mode, ssoOrigin: ssoOrigin.value }).catch(() => null)

    if (res?.ok) {
      const sessionUser = (res.session as { user?: unknown }).user as YunleSessionUser | undefined
      user.value = mapYunleSsoSession({ user: sessionUser })
      if (user.value) {
        lastSyncedAt.value = Date.now()
        status.value = 'authenticated'
      }
      else {
        status.value = 'anonymous'
      }
      return user.value
    }

    // 失败：未登录 → 清空；网络/超时/弹窗问题 → 保留现有登录态
    const reason = res?.reason ?? 'error'
    if (reason === 'not_authenticated') {
      user.value = null
      lastSyncedAt.value = 0
      status.value = 'anonymous'
    }
    else if (mode === 'interactive') {
      status.value = user.value ? 'authenticated' : 'error'
      error.value = ssoFailMessage(reason)
    }
    else {
      status.value = user.value ? 'authenticated' : 'anonymous'
    }
    return user.value
  }

  async function syncSilently(options: { force?: boolean } = {}) {
    if (!import.meta.client)
      return user.value
    if (pendingSilent)
      return pendingSilent

    const isFresh = Date.now() - lastSyncedAt.value < 5 * 60 * 1000
    if (!options.force && user.value && isFresh)
      return user.value

    pendingSilent = runSso('silent').finally(() => {
      pendingSilent = null
    })
    return pendingSilent
  }

  async function login() {
    return runSso('interactive')
  }

  async function refresh() {
    return syncSilently({ force: true })
  }

  async function logout() {
    const auth = useCloudbaseAuth()
    try {
      await auth?.signOut()
    }
    catch {}
    user.value = null
    lastSyncedAt.value = 0
    status.value = 'idle'
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
