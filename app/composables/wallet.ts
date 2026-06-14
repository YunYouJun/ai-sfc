import { acceptHMRUpdate, defineStore } from 'pinia'
import { apiGetBalance } from '~/utils'

export const useWalletStore = defineStore('wallet', () => {
  const userStore = useUserStore()

  /** 云币余额；null 表示未知（未登录 / 未配置 CloudBase / 接口缺失） */
  const balance = shallowRef<number | null>(null)
  const costPerGeneration = shallowRef(1)
  const loading = shallowRef(false)

  /** 剩余可生成次数 */
  const remaining = computed(() =>
    balance.value === null
      ? null
      : Math.floor(balance.value / Math.max(1, costPerGeneration.value)),
  )

  function setBalance(next: number) {
    balance.value = next
  }

  async function refresh() {
    if (!userStore.isAuthenticated) {
      balance.value = null
      return
    }
    loading.value = true
    try {
      const data = await apiGetBalance(userStore.getAccessToken())
      if (data) {
        balance.value = typeof data.balance === 'number' ? data.balance : null
        if (typeof data.costPerGeneration === 'number')
          costPerGeneration.value = data.costPerGeneration
      }
    }
    finally {
      loading.value = false
    }
  }

  // 登录态变化：登录后拉取余额，登出清空
  watch(() => userStore.isAuthenticated, (authed) => {
    if (authed)
      refresh()
    else
      balance.value = null
  })

  return {
    balance,
    costPerGeneration,
    remaining,
    loading,
    setBalance,
    refresh,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot))
