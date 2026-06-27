<script lang="ts" setup>
import type { CoupletHistoryItem } from '~/composables/couplet-history'

const userStore = useUserStore()
const app = useAppStore()
const history = useCoupletHistoryStore()

onMounted(() => {
  if (userStore.isAuthenticated)
    history.refresh()
})
watch(() => userStore.isAuthenticated, (authed) => {
  if (authed)
    history.refresh()
})

/** 收藏置顶、再按时间倒序 */
const sorted = computed(() =>
  [...history.items].sort(
    (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.createdAt - a.createdAt,
  ),
)

async function useCouplet(item: CoupletHistoryItem) {
  await app.setCoupletsData(item.couplets)
  await navigateTo('/')
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="history-page">
    <header class="history-head">
      <h1 class="font-zmx">
        我的春联
      </h1>
      <NuxtLink to="/" class="back-link">
        ← 返回生成
      </NuxtLink>
    </header>

    <div v-if="!userStore.isAuthenticated" class="history-empty">
      <p>登录后即可保存与查看你生成过的春联。</p>
      <button type="button" class="primary-btn" @click="userStore.login()">
        登录
      </button>
    </div>
    <div v-else-if="history.loading && !history.items.length" class="history-empty">
      <span class="i-svg-spinners:pulse" /> 加载中…
    </div>
    <div v-else-if="!history.items.length" class="history-empty">
      还没有保存的春联，去<NuxtLink to="/">
        生成一副
      </NuxtLink>吧。
    </div>

    <ul v-else class="history-list">
      <li v-for="item in sorted" :key="item._id" class="history-card">
        <div class="card-couplet font-zmx">
          <span class="line">{{ item.couplets['上联'] }}</span>
          <span class="line">{{ item.couplets['下联'] }}</span>
          <span class="plaque">{{ item.couplets['横批'] }}</span>
        </div>
        <div class="card-meta">
          <span class="card-prompt">{{ item.prompt || '—' }}</span>
          <span class="card-time">{{ formatTime(item.createdAt) }}</span>
        </div>
        <div class="card-actions">
          <button
            type="button"
            class="icon-btn"
            :class="{ active: item.isFavorite }"
            :title="item.isFavorite ? '取消收藏' : '收藏'"
            @click="history.toggleFavorite(item)"
          >
            <span :class="item.isFavorite ? 'i-ri-star-fill' : 'i-ri-star-line'" />
          </button>
          <button type="button" class="icon-btn" title="用此春联" @click="useCouplet(item)">
            <span class="i-ri-eye-line" />
          </button>
          <button type="button" class="danger icon-btn" title="删除" @click="history.remove(item)">
            <span class="i-ri-delete-bin-line" />
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.history-page {
  width: min(100% - 2rem, 60rem);
  margin: 1rem auto 3rem;
}

.history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.history-head h1 {
  color: var(--sfc-seal);
  font-size: 2rem;
}

.back-link {
  color: var(--sfc-ink-muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 3rem 1rem;
  color: var(--sfc-ink-muted);
  text-align: center;
}

.primary-btn {
  padding: 0.5rem 1.4rem;
  border-radius: 999px;
  background: var(--sfc-seal);
  color: var(--sfc-gold-soft);
  font-weight: 800;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.85rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--sfc-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--sfc-control) 60%, transparent);
}

.card-couplet {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  color: var(--sfc-ink);
  font-size: 1.35rem;
  line-height: 1.4;
}

.card-couplet .plaque {
  color: var(--sfc-seal);
  font-size: 1.05rem;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--sfc-ink-muted);
  font-size: 0.8rem;
}

.card-prompt {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-time {
  flex: 0 0 auto;
}

.card-actions {
  display: flex;
  gap: 0.4rem;
}

.icon-btn {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sfc-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--sfc-ink);
  transition:
    border-color 0.16s ease,
    color 0.16s ease;
}

.icon-btn:hover {
  border-color: var(--sfc-seal);
}

.icon-btn.active {
  color: #e0a93b;
  border-color: #e0a93b;
}

.icon-btn.danger:hover {
  color: var(--sfc-cinnabar);
  border-color: var(--sfc-cinnabar);
}

.dark .icon-btn {
  background: rgba(48, 24, 22, 0.5);
}
</style>
