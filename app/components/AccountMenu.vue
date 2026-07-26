<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useAvatarUrl } from '~/composables/avatar-url'

const userStore = useUserStore()
const wallet = useWalletStore()
const open = shallowRef(false)

const accountInitial = computed(() => userStore.displayName.slice(0, 1).toUpperCase())
const userSubtitle = computed(() => userStore.user?.email || userStore.user?.phone || userStore.user?.login || '云乐坊账号')
const rechargeUrl = computed(() => userStore.getYunleUrl('/wallet?from=ai-sfc'))
const resolvedAvatar = useAvatarUrl(() => userStore.user?.avatar)
const avatarLoadFailed = shallowRef(false)
const visibleAvatar = computed(() => avatarLoadFailed.value ? '' : resolvedAvatar.value)

watch(resolvedAvatar, () => {
  avatarLoadFailed.value = false
})

function handleAvatarError() {
  avatarLoadFailed.value = true
}

async function login() {
  await userStore.login()
  if (userStore.isAuthenticated)
    open.value = false
}

async function refresh(event: Event) {
  event.preventDefault()
  await userStore.refresh()
}

async function logout() {
  await userStore.logout()
  open.value = false
}

onMounted(() => {
  if (userStore.isAuthenticated)
    wallet.refresh()
})
</script>

<template>
  <div class="account-menu">
    <DropdownMenuRoot
      v-if="userStore.isAuthenticated"
      v-model:open="open"
      :modal="false"
    >
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="account-trigger"
          aria-label="云乐坊账号"
        >
          <img
            v-if="visibleAvatar"
            :src="visibleAvatar"
            :alt="userStore.displayName"
            class="account-avatar"
            @error="handleAvatarError"
          >
          <span v-else class="account-avatar account-avatar-fallback">{{ accountInitial }}</span>
          <span class="account-name">{{ userStore.displayName }}</span>
          <span class="account-chevron i-ri-arrow-down-s-line" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          class="account-popover"
          align="end"
          :side-offset="12"
          :collision-padding="16"
        >
          <DropdownMenuLabel class="account-card-header">
            <img
              v-if="visibleAvatar"
              :src="visibleAvatar"
              :alt="userStore.displayName"
              class="account-card-avatar"
              @error="handleAvatarError"
            >
            <span v-else class="account-card-avatar account-avatar-fallback">{{ accountInitial }}</span>
            <span class="account-card-copy">
              <strong>{{ userStore.displayName }}</strong>
              <span>{{ userSubtitle }}</span>
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator class="account-separator" />

          <DropdownMenuGroup class="account-wallet">
            <span class="wallet-figure">
              <span class="wallet-label">云币余额</span>
              <strong class="wallet-value">
                <span v-if="wallet.loading" class="i-svg-spinners:pulse" />
                <template v-else>{{ wallet.balance ?? '—' }}</template>
              </strong>
            </span>
            <DropdownMenuItem as-child>
              <a class="wallet-recharge font-zmx" :href="rechargeUrl" target="_blank" rel="noopener noreferrer">充值</a>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <a class="account-action" :href="userStore.getYunleUrl('/profile')" target="_blank" rel="noopener noreferrer">
                <span class="i-ri-user-line" />
                <span>个人中心</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              class="account-action"
              :disabled="userStore.loading"
              @select="refresh"
            >
              <span :class="userStore.loading ? 'i-svg-spinners:pulse' : 'i-ri-refresh-line'" />
              <span>重新同步</span>
            </DropdownMenuItem>
            <DropdownMenuItem class="account-action danger" @select="logout">
              <span class="i-ri-logout-box-r-line" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>

    <button
      v-else
      type="button"
      class="font-zmx account-login"
      :disabled="userStore.loading"
      :aria-label="userStore.accountLabel"
      @click="login"
    >
      <span
        class="account-login-icon"
        :class="userStore.loading ? 'i-svg-spinners:pulse' : 'i-ri-user-smile-line'"
      />
      <span class="account-login-copy">{{ userStore.accountLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.account-menu {
  position: relative;
}

.account-trigger,
.account-login {
  min-height: var(--sfc-ctrl-size);
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--sfc-border-strong);
  border-radius: 999px;
  background: var(--sfc-control);
  color: var(--sfc-ink);
  box-shadow: var(--sfc-control-shadow);
  backdrop-filter: blur(14px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.account-trigger {
  height: var(--sfc-ctrl-size);
  padding: 0 0.7rem 0 0.25rem;
}

.account-login {
  justify-content: center;
  padding: 0.45rem 1rem;
  border-color: rgba(179, 38, 30, 0.28);
  background: linear-gradient(145deg, rgba(255, 242, 199, 0.94), rgba(246, 207, 131, 0.76)), var(--sfc-gold-soft);
  color: var(--sfc-cinnabar);
  font-size: 1.08rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1;
  white-space: nowrap;
}

.account-trigger:hover,
.account-login:hover {
  transform: translateY(-1px);
  border-color: rgba(184, 44, 29, 0.34);
  box-shadow: 0 16px 36px rgba(97, 29, 18, 0.14);
}

.account-login:disabled {
  cursor: wait;
  opacity: 0.75;
}

.account-avatar {
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: 999px;
  object-fit: cover;
}

.account-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--sfc-seal);
  color: var(--sfc-gold-soft);
  font-weight: 800;
}

.account-name {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.account-chevron {
  color: var(--sfc-ink-muted);
}

.account-login-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
  color: var(--sfc-cinnabar);
}

.account-login-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .account-trigger,
.dark .account-login {
  border-color: var(--sfc-border-strong);
  background: var(--sfc-control);
  color: var(--sfc-gold-soft);
  box-shadow: var(--sfc-control-shadow);
}

@media (max-width: 640px) {
  .account-name,
  .account-chevron {
    display: none;
  }

  /* 折叠成与图标钮一致的圆：固定为统一控件尺寸、头像居中留细边框 */
  .account-trigger {
    width: var(--sfc-ctrl-size);
    height: var(--sfc-ctrl-size);
    padding: 0;
    justify-content: center;
  }

  .account-login {
    gap: 0.38rem;
    padding: 0.42rem 0.82rem;
    font-size: 1rem;
  }
}
</style>

<style>
.account-popover {
  z-index: 20;
  width: min(18rem, calc(100vw - 2rem));
  padding: 0.6rem;
  border: 1px solid var(--sfc-border-strong);
  border-radius: 8px;
  background: rgba(255, 253, 247, 0.96);
  box-shadow: 0 24px 60px rgba(56, 18, 12, 0.2);
  backdrop-filter: blur(18px);
}

.account-popover .account-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem;
}

.account-popover .account-separator {
  height: 1px;
  margin: 0.35rem 0;
  background: var(--sfc-border);
}

.account-popover .account-card-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: 999px;
  object-fit: cover;
}

.account-popover .account-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--sfc-seal);
  color: var(--sfc-gold-soft);
  font-weight: 800;
}

.account-popover .account-card-copy {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.account-popover .account-card-copy strong,
.account-popover .account-card-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-popover .account-card-copy span {
  color: var(--sfc-ink-muted);
  font-size: 0.82rem;
}

.account-popover .account-wallet {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  padding: 0.5rem 0.55rem;
  border: 1px solid rgba(179, 38, 30, 0.14);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(255, 243, 212, 0.9), rgba(246, 207, 131, 0.5));
}

.account-popover .wallet-figure {
  display: grid;
  gap: 0.1rem;
}

.account-popover .wallet-label {
  color: var(--sfc-ink-muted);
  font-size: 0.74rem;
  font-weight: 800;
}

.account-popover .wallet-value {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--sfc-cinnabar);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
}

.account-popover .wallet-recharge {
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.95rem;
  border-radius: 999px;
  background: var(--sfc-seal);
  color: var(--sfc-gold-soft);
  font-size: 1.05rem;
  letter-spacing: 0;
}

.account-popover .wallet-recharge:hover {
  background: var(--sfc-seal-deep);
}

.account-popover .wallet-recharge[data-highlighted] {
  outline: 2px solid rgba(179, 38, 30, 0.28);
  outline-offset: 2px;
}

.account-popover .account-action {
  width: 100%;
  min-height: 2.35rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  color: var(--sfc-ink);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.16s ease,
    color 0.16s ease;
}

.account-popover .account-action:hover,
.account-popover .account-action[data-highlighted] {
  outline: none;
  background: rgba(179, 38, 30, 0.08);
  color: var(--sfc-cinnabar);
}

.account-popover .account-action[data-disabled] {
  cursor: wait;
  opacity: 0.7;
}

.account-popover .account-action.danger {
  color: var(--sfc-cinnabar);
}

.dark .account-popover {
  border-color: rgba(255, 219, 142, 0.16);
  background: rgba(39, 20, 20, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
}

.dark .account-popover .account-separator {
  background: rgba(255, 219, 142, 0.13);
}

.dark .account-popover .account-wallet {
  border-color: rgba(255, 219, 142, 0.16);
  background: linear-gradient(145deg, rgba(48, 24, 22, 0.9), rgba(35, 20, 20, 0.55));
}

.dark .account-popover .wallet-label {
  color: rgba(255, 244, 214, 0.64);
}

.dark .account-popover .wallet-value {
  color: var(--sfc-gold);
}

.dark .account-popover .account-action {
  color: var(--sfc-gold-soft);
}

.dark .account-popover .account-action:hover,
.dark .account-popover .account-action[data-highlighted] {
  background: rgba(255, 219, 142, 0.1);
  color: var(--sfc-gold);
}

.dark .account-popover .account-action.danger {
  color: var(--sfc-cinnabar);
}
</style>
