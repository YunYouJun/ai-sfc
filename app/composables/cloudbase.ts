import cloudbase from '@cloudbase/js-sdk'

function initAuth() {
  const config = useRuntimeConfig()
  const app = cloudbase.init({
    env: String(config.public.cloudbaseEnvId),
    region: 'ap-shanghai',
    // ⚠️ 必须 false：自动模式会消费 URL 上的 OAuth code 并整页刷新，吞掉绑定结果、产生竞态（官方接入坑①）
    auth: { detectSessionInUrl: false },
  })
  return app.auth({ persistence: 'local' })
}

let cachedAuth: ReturnType<typeof initAuth> | null = null

/** CloudBase 前端 auth 单例（仅浏览器）。@yunlefun/sso 的 setSession / token 自动续期都靠它。 */
export function useCloudbaseAuth() {
  if (!import.meta.client)
    return null
  if (!cachedAuth)
    cachedAuth = initAuth()
  return cachedAuth
}
