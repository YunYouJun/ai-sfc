import type { MaybeRefOrGetter } from 'vue'
import { useStorage } from '@vueuse/core'
import { resolveAvatarUrl, toCloudbaseAvatarFileID } from '~/utils/avatar'

const pendingAvatarUrls = new Map<string, Promise<string | undefined>>()
const AVATAR_URL_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
const AVATAR_URL_CACHE_LIMIT = 50

interface CachedAvatarUrl {
  url: string
  expiresAt: number
}

function rememberAvatarUrl(
  cache: Record<string, CachedAvatarUrl>,
  fileID: string,
  url: string,
): Record<string, CachedAvatarUrl> {
  const now = Date.now()
  const entries = Object.entries(cache)
    .filter(([, item]) => item.expiresAt > now)
    .sort(([, a], [, b]) => b.expiresAt - a.expiresAt)
    .slice(0, AVATAR_URL_CACHE_LIMIT - 1)

  return {
    ...Object.fromEntries(entries),
    [fileID]: {
      url,
      expiresAt: now + AVATAR_URL_CACHE_TTL_MS,
    },
  }
}

/**
 * 将头像 fileID 解析为公开 CDN URL。
 * 结果按 fileID 持久缓存；头像更新会生成新 fileID，因此无需主动清理旧 URL。
 */
export function useAvatarUrl(source: MaybeRefOrGetter<string | null | undefined>) {
  const config = useRuntimeConfig()
  const envId = String(config.public.cloudbaseEnvId || '')
  const cache = useStorage<Record<string, CachedAvatarUrl>>('ai-sfc:avatar-url-cache', {})
  const resolvedUrl = shallowRef<string>()
  let revision = 0

  watch(
    () => toValue(source),
    async (value) => {
      const currentRevision = ++revision
      const fileID = toCloudbaseAvatarFileID(value, envId)
      if (fileID) {
        const cached = cache.value[fileID]
        if (cached && cached.expiresAt > Date.now()) {
          resolvedUrl.value = cached.url
          return
        }
        if (cached) {
          const nextCache = { ...cache.value }
          delete nextCache[fileID]
          cache.value = nextCache
        }
      }

      const app = useCloudbaseApp()
      let pending = fileID ? pendingAvatarUrls.get(fileID) : undefined
      if (!pending) {
        pending = resolveAvatarUrl(
          value,
          envId,
          options => app?.getTempFileURL(options) ?? Promise.resolve(undefined),
        )
        if (fileID) {
          pendingAvatarUrls.set(fileID, pending)
          pending.finally(() => pendingAvatarUrls.delete(fileID))
        }
      }

      const nextUrl = await pending
      if (currentRevision === revision) {
        if (fileID && nextUrl)
          cache.value = rememberAvatarUrl(cache.value, fileID, nextUrl)
        resolvedUrl.value = nextUrl
      }
    },
    { immediate: true },
  )

  return readonly(resolvedUrl)
}
