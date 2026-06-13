import type { YunleSsoMessage, YunleUser } from '~/utils/yunle-sso'
import { useStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  buildYunleSsoUrl,
  defaultYunleSsoOrigin,
  isExpectedYunleSsoMessage,
  mapYunleSsoSession,
  readString,
  trimTrailingSlash,
} from '~/utils/yunle-sso'

const ns = 'ai-sfc'
const silentTimeout = 12000
const interactiveTimeout = 120000

type SsoMode = 'silent' | 'interactive'
type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'anonymous' | 'error'

function createNonce() {
  if (window.crypto?.randomUUID)
    return window.crypto.randomUUID()

  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(4)
    window.crypto.getRandomValues(values)
    return Array.from(values, value => value.toString(16)).join('')
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const useUserStore = defineStore('user', () => {
  const runtimeConfig = useRuntimeConfig()
  const user = useStorage<YunleUser | null>(`${ns}:yunle-user`, null)
  const lastSyncedAt = useStorage(`${ns}:yunle-user-synced-at`, 0)
  const status = shallowRef<AuthStatus>(user.value ? 'authenticated' : 'idle')
  const error = shallowRef('')
  let pendingSilentSync: Promise<YunleUser | null> | null = null

  const ssoOrigin = computed(() => {
    const configured = readString(runtimeConfig.public.yunleSsoOrigin)
    return trimTrailingSlash(configured || defaultYunleSsoOrigin)
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
    return '云乐坊登录'
  })

  function getYunleUrl(path = '/') {
    return new URL(path, `${ssoOrigin.value}/`).toString()
  }

  function buildSsoUrl(mode: SsoMode, nonce: string) {
    return buildYunleSsoUrl({
      mode,
      nonce,
      ssoOrigin: ssoOrigin.value,
      targetOrigin: window.location.origin,
    })
  }

  function clearAuth(nextStatus: AuthStatus = 'idle') {
    user.value = null
    lastSyncedAt.value = 0
    status.value = nextStatus
  }

  async function requestSso(mode: SsoMode) {
    if (!import.meta.client)
      return user.value

    status.value = 'checking'
    error.value = ''

    const nonce = createNonce()
    const url = buildSsoUrl(mode, nonce)

    return await new Promise<YunleUser | null>((resolve) => {
      let iframe: HTMLIFrameElement | null = null
      let popup: Window | null = null
      let popupTimer: number | undefined
      let settled = false

      const timeout = window.setTimeout(() => {
        finish(null, mode === 'silent' ? 'anonymous' : 'error', mode === 'silent' ? '' : '云乐坊账号同步超时')
      }, mode === 'silent' ? silentTimeout : interactiveTimeout)

      function cleanup() {
        window.clearTimeout(timeout)
        if (popupTimer)
          window.clearInterval(popupTimer)
        window.removeEventListener('message', onMessage)
        iframe?.remove()
      }

      function finish(nextUser: YunleUser | null, nextStatus: AuthStatus, nextError = '') {
        if (settled)
          return
        settled = true
        cleanup()
        if (nextUser) {
          user.value = nextUser
          lastSyncedAt.value = Date.now()
          status.value = 'authenticated'
        }
        else if (nextStatus === 'anonymous') {
          clearAuth('anonymous')
        }
        else if (nextStatus === 'error') {
          status.value = 'error'
        }
        else {
          status.value = nextStatus
        }
        error.value = nextError
        resolve(nextUser)
      }

      function onMessage(event: MessageEvent<YunleSsoMessage>) {
        const data = event.data
        if (!isExpectedYunleSsoMessage({
          data,
          eventOrigin: event.origin,
          expectedNonce: nonce,
          expectedOrigin: ssoOrigin.value,
        })) {
          return
        }

        if (!data.ok) {
          const message = data.reason === 'not_authenticated' ? '' : '云乐坊账号同步失败'
          finish(null, data.reason === 'not_authenticated' ? 'anonymous' : 'error', message)
          return
        }

        const nextUser = mapYunleSsoSession(data.session)
        if (!nextUser) {
          finish(null, 'error', '云乐坊账号信息不完整')
          return
        }

        finish(nextUser, 'authenticated')
      }

      window.addEventListener('message', onMessage)

      if (mode === 'silent') {
        iframe = document.createElement('iframe')
        iframe.src = url
        iframe.title = 'YunLeFun SSO'
        iframe.hidden = true
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        return
      }

      const width = 480
      const height = 680
      const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
      const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)

      popup = window.open(
        url,
        'yunle_sso',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`,
      )

      if (!popup) {
        finish(null, 'error', '浏览器拦截了云乐坊登录窗口')
        return
      }

      popup.focus()
      popupTimer = window.setInterval(() => {
        if (!popup?.closed)
          return
        finish(null, user.value ? 'authenticated' : 'idle')
      }, 500)
    })
  }

  async function syncSilently(options: { force?: boolean } = {}) {
    if (!import.meta.client)
      return user.value

    if (pendingSilentSync)
      return pendingSilentSync

    const isFresh = Date.now() - lastSyncedAt.value < 5 * 60 * 1000
    if (!options.force && user.value && isFresh)
      return user.value

    pendingSilentSync = requestSso('silent').finally(() => {
      pendingSilentSync = null
    })

    return pendingSilentSync
  }

  async function login() {
    return await requestSso('interactive')
  }

  async function refresh() {
    return await syncSilently({ force: true })
  }

  function logout() {
    clearAuth('idle')
    error.value = ''
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
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
