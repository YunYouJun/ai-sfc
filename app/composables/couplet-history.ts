import type { SprintFestivalCouplets } from '~~/packages/ai/src'

/** 我的春联集合（加 app 前缀，做共享 CloudBase env 的好公民） */
const COLLECTION = 'ai_sfc_couplet_history'

export interface CoupletHistoryItem {
  _id: string
  couplets: SprintFestivalCouplets
  prompt: string
  isFavorite: boolean
  createdAt: number
}

/**
 * 登录用户「我的春联」历史/收藏。
 * 前端用 CloudBase database 直写集合 `ai_sfc_couplet_history`，安全规则按创建者 `_openid` 隔离
 * （CloudBase 在登录态下 add 时自动写入 `_openid`），ai-sfc 独占这块数据、yunle 不参与（解耦）。
 */
export const useCoupletHistoryStore = defineStore('couplet-history', () => {
  const userStore = useUserStore()
  const items = ref<CoupletHistoryItem[]>([])
  const loading = ref(false)

  function collection() {
    const app = useCloudbaseApp()
    return app && userStore.isAuthenticated ? app.database().collection(COLLECTION) : null
  }

  /** 生成成功后保存（仅登录态）；失败静默——历史是增值能力，不应阻断主流程 */
  async function save(couplets: SprintFestivalCouplets, prompt: string) {
    const col = collection()
    if (!col)
      return
    try {
      await col.add({ couplets, prompt: prompt.slice(0, 500), isFavorite: false, createdAt: Date.now() })
    }
    catch (error) {
      console.error('[couplet-history] save', error)
    }
  }

  async function refresh(limit = 50) {
    const col = collection()
    if (!col) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const res = await col.orderBy('createdAt', 'desc').limit(limit).get()
      items.value = (res?.data ?? []) as CoupletHistoryItem[]
    }
    catch (error) {
      console.error('[couplet-history] refresh', error)
    }
    finally {
      loading.value = false
    }
  }

  async function toggleFavorite(item: CoupletHistoryItem) {
    const col = collection()
    if (!col)
      return
    const next = !item.isFavorite
    item.isFavorite = next // 乐观更新
    try {
      await col.doc(item._id).update({ isFavorite: next })
    }
    catch (error) {
      item.isFavorite = !next // 回滚
      console.error('[couplet-history] toggleFavorite', error)
    }
  }

  async function remove(item: CoupletHistoryItem) {
    const col = collection()
    if (!col)
      return
    const idx = items.value.findIndex(i => i._id === item._id)
    if (idx >= 0)
      items.value.splice(idx, 1) // 乐观删除
    try {
      await col.doc(item._id).remove()
    }
    catch (error) {
      console.error('[couplet-history] remove', error)
      refresh()
    }
  }

  // 登出即清空本地列表
  watch(() => userStore.isAuthenticated, (authed) => {
    if (!authed)
      items.value = []
  })

  return { items, loading, save, refresh, toggleFavorite, remove }
})
