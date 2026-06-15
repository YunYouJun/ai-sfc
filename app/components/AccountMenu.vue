<script setup lang="ts">
const userStore = useUserStore()
const wallet = useWalletStore()
const open = shallowRef(false)

const accountInitial = computed(() => userStore.displayName.slice(0, 1).toUpperCase())
const userSubtitle = computed(() => userStore.user?.email || userStore.user?.phone || userStore.user?.login || '云乐坊账号')
const rechargeUrl = computed(() => userStore.getYunleUrl('/wallet?from=ai-sfc'))

async function login() {
  await userStore.login()
  if (userStore.isAuthenticated)
    open.value = false
}

async function refresh() {
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
    <button
      v-if="userStore.isAuthenticated"
      type="button"
      class="account-trigger"
      :aria-expanded="open"
      aria-label="云乐坊账号"
      @click="open = !open"
    >
      <img
        v-if="userStore.user?.avatar"
        :src="userStore.user.avatar"
        :alt="userStore.displayName"
        class="account-avatar"
      >
      <span v-else class="account-avatar account-avatar-fallback">{{ accountInitial }}</span>
      <span class="account-name">{{ userStore.displayName }}</span>
      <span class="account-chevron i-ri-arrow-down-s-line" />
    </button>

    <button
      v-else
      type="button"
      class="font-zmx account-login"
      :disabled="userStore.loading"
      @click="login"
    >
      <span
        class="account-login-icon"
        :class="userStore.loading ? 'i-svg-spinners:pulse' : 'i-ri-user-smile-line'"
      />
      <span>{{ userStore.accountLabel }}</span>
    </button>

    <div v-if="userStore.isAuthenticated && open" class="account-popover">
      <div class="account-card-header">
        <img
          v-if="userStore.user?.avatar"
          :src="userStore.user.avatar"
          :alt="userStore.displayName"
          class="account-card-avatar"
        >
        <span v-else class="account-card-avatar account-avatar-fallback">{{ accountInitial }}</span>
        <div class="account-card-copy">
          <strong>{{ userStore.displayName }}</strong>
          <span>{{ userSubtitle }}</span>
        </div>
      </div>

      <div class="account-wallet">
        <div class="wallet-figure">
          <span class="wallet-label">云币余额</span>
          <strong class="wallet-value">
            <span v-if="wallet.loading" class="i-svg-spinners:pulse" />
            <template v-else>{{ wallet.balance ?? '—' }}</template>
          </strong>
        </div>
        <a class="wallet-recharge font-zmx" :href="rechargeUrl" target="_blank" rel="noopener noreferrer">充值</a>
      </div>

      <a class="account-action" :href="userStore.getYunleUrl('/profile')" target="_blank" rel="noopener noreferrer">
        <span class="i-ri-user-line" />
        <span>个人中心</span>
      </a>
      <button type="button" class="account-action" :disabled="userStore.loading" @click="refresh">
        <span :class="userStore.loading ? 'i-svg-spinners:pulse' : 'i-ri-refresh-line'" />
        <span>重新同步</span>
      </button>
      <button type="button" class="account-action danger" @click="logout">
        <span class="i-ri-logout-box-r-line" />
        <span>退出登录</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.account-menu {
  position: relative;
}

.account-trigger,
.account-login {
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(126, 36, 23, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #3b1711;
  box-shadow: 0 12px 32px rgba(97, 29, 18, 0.1);
  backdrop-filter: blur(14px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.account-trigger {
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
}

.account-login {
  padding: 0.45rem 0.9rem;
  border-color: rgba(179, 38, 30, 0.28);
  background: linear-gradient(145deg, rgba(255, 243, 212, 0.96), rgba(246, 207, 131, 0.82));
  color: #a9231b;
  font-size: 1.08rem;
  font-weight: 400;
  letter-spacing: 0;
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

.account-avatar,
.account-card-avatar {
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
  background: #b3261e;
  color: #fff8df;
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
  color: rgba(59, 23, 17, 0.64);
}

.account-login-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: #b3261e;
}

.account-popover {
  position: absolute;
  right: 0;
  top: calc(100% + 0.75rem);
  z-index: 20;
  width: min(18rem, calc(100vw - 2rem));
  padding: 0.6rem;
  border: 1px solid rgba(126, 36, 23, 0.18);
  border-radius: 8px;
  background: rgba(255, 253, 247, 0.96);
  box-shadow: 0 24px 60px rgba(56, 18, 12, 0.2);
  backdrop-filter: blur(18px);
}

.account-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem;
  border-bottom: 1px solid rgba(126, 36, 23, 0.12);
  margin-bottom: 0.35rem;
}

.account-card-avatar {
  width: 2.5rem;
  height: 2.5rem;
}

.account-card-copy {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.account-card-copy strong,
.account-card-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card-copy span {
  color: rgba(59, 23, 17, 0.64);
  font-size: 0.82rem;
}

.account-wallet {
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

.wallet-figure {
  display: grid;
  gap: 0.1rem;
}

.wallet-label {
  color: rgba(59, 23, 17, 0.62);
  font-size: 0.74rem;
  font-weight: 800;
}

.wallet-value {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #a9231b;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
}

.wallet-recharge {
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.95rem;
  border-radius: 999px;
  background: #b3261e;
  color: #fff2c7;
  font-size: 1.05rem;
  letter-spacing: 0;
}

.wallet-recharge:hover {
  background: #a9231b;
}

.account-action {
  width: 100%;
  min-height: 2.35rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  color: #3b1711;
  text-align: left;
  transition:
    background 0.16s ease,
    color 0.16s ease;
}

.account-action:hover {
  background: rgba(179, 38, 30, 0.08);
  color: #a9231b;
}

.account-action:disabled {
  cursor: wait;
  opacity: 0.7;
}

.account-action.danger {
  color: #a9231b;
}

.dark .account-trigger,
.dark .account-login {
  border-color: rgba(255, 219, 142, 0.16);
  background: rgba(48, 24, 22, 0.76);
  color: #fff4d6;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.26);
}

.dark .account-popover {
  border-color: rgba(255, 219, 142, 0.16);
  background: rgba(39, 20, 20, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
}

.dark .account-card-header {
  border-bottom-color: rgba(255, 219, 142, 0.13);
}

.dark .account-wallet {
  border-color: rgba(255, 219, 142, 0.16);
  background: linear-gradient(145deg, rgba(48, 24, 22, 0.9), rgba(35, 20, 20, 0.55));
}

.dark .wallet-label {
  color: rgba(255, 244, 214, 0.64);
}

.dark .wallet-value {
  color: #ffcf72;
}

.dark .account-card-copy span,
.dark .account-chevron {
  color: rgba(255, 244, 214, 0.66);
}

.dark .account-action {
  color: #fff4d6;
}

.dark .account-action:hover {
  background: rgba(255, 219, 142, 0.1);
  color: #ffdb8e;
}

.dark .account-action.danger {
  color: #ff9b8e;
}

@media (max-width: 640px) {
  .account-name,
  .account-chevron {
    display: none;
  }

  .account-trigger {
    padding-right: 0.25rem;
  }
}
</style>
