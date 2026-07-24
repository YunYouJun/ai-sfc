import type { MaybeRefOrGetter } from 'vue'
import {
  AVATAR_SIGNED_URL_TTL_SECONDS,
  resolveAvatarUrl,
  toCloudbaseAvatarFileID,
} from '~/utils/avatar'

const pendingAvatarUrls = new Map<string, Promise<string | undefined>>()
const resolvedAvatarUrls = new Map<string, CachedAvatarUrl>()
const AVATAR_URL_CACHE_TTL_MS = (AVATAR_SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000
const AVATAR_URL_CACHE_LIMIT = 50

interface CachedAvatarUrl {
  url: string
  expiresAt: number
}

function rememberAvatarUrl(
  fileID: string,
  url: string,
): void {
  const now = Date.now()
  for (const [key, item] of resolvedAvatarUrls) {
    if (item.expiresAt <= now)
      resolvedAvatarUrls.delete(key)
  }
  if (resolvedAvatarUrls.size >= AVATAR_URL_CACHE_LIMIT) {
    const oldestKey = resolvedAvatarUrls.keys().next().value
    if (oldestKey)
      resolvedAvatarUrls.delete(oldestKey)
  }
  resolvedAvatarUrls.set(fileID, {
    url,
    expiresAt: now + AVATAR_URL_CACHE_TTL_MS,
  })
}

/**
 * 将头像 fileID 解析为短期签名 URL。
 * URL 仅在当前页面会话内缓存；数据库和浏览器持久存储都只保留稳定 fileID。
 */
export function useAvatarUrl(source: MaybeRefOrGetter<string | null | undefined>) {
  const config = useRuntimeConfig()
  const envId = String(config.public.cloudbaseEnvId || '')
  const resolvedUrl = shallowRef<string>()
  let revision = 0

  watch(
    () => toValue(source),
    async (value) => {
      const currentRevision = ++revision
      const fileID = toCloudbaseAvatarFileID(value, envId)
      if (fileID) {
        const cached = resolvedAvatarUrls.get(fileID)
        if (cached && cached.expiresAt > Date.now()) {
          resolvedUrl.value = cached.url
          return
        }
        if (cached)
          resolvedAvatarUrls.delete(fileID)
      }

      const app = useCloudbaseApp()
      let pending = fileID ? pendingAvatarUrls.get(fileID) : undefined
      if (!pending) {
        pending = resolveAvatarUrl(
          value,
          envId,
          (avatarFileID, expiresIn) =>
            app?.storage.from().createSignedUrl(avatarFileID, expiresIn)
            ?? Promise.resolve(undefined),
        )
        if (fileID) {
          pendingAvatarUrls.set(fileID, pending)
          pending.finally(() => pendingAvatarUrls.delete(fileID))
        }
      }

      const nextUrl = await pending
      if (currentRevision === revision) {
        if (fileID && nextUrl)
          rememberAvatarUrl(fileID, nextUrl)
        resolvedUrl.value = nextUrl
      }
    },
    { immediate: true },
  )

  return readonly(resolvedUrl)
}
