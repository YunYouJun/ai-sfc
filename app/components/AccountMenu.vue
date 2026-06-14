<script setup lang="ts">
const userStore = useUserStore()
const wallet = useWalletStore()
const open = shallowRef(false)
const loginDialogOpen = shallowRef(false)
const loginFrameUrl = shallowRef('')
let loginRequest: ReturnType<typeof userStore.createInteractiveLogin> | null = null

const accountInitial = computed(() => userStore.displayName.slice(0, 1).toUpperCase())
const userSubtitle = computed(() => userStore.user?.email || userStore.user?.phone || userStore.user?.login || '云乐坊账号')
const rechargeUrl = computed(() => userStore.getYunleUrl('/wallet?from=ai-sfc'))

async function login() {
  closeLoginDialog()

  const request = userStore.createInteractiveLogin()
  loginRequest = request
  loginFrameUrl.value = request.url
  loginDialogOpen.value = true

  const nextUser = await request.done
  if (loginRequest !== request)
    return

  loginRequest = null
  loginFrameUrl.value = ''
  loginDialogOpen.value = false
  if (nextUser)
    open.value = false
}

async function loginInWindow() {
  closeLoginDialog()
  await userStore.login()
  open.value = false
}

function closeLoginDialog() {
  if (loginRequest) {
    const request = loginRequest
    loginRequest = null
    request.cancel()
  }
  loginFrameUrl.value = ''
  loginDialogOpen.value = false
}

async function refresh() {
  await userStore.refresh()
}

function logout() {
  userStore.logout()
  open.value = false
}

onMounted(() => {
  if (userStore.isAuthenticated)
    wallet.refresh()
})

onBeforeUnmount(() => {
  closeLoginDialog()
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
        <span>退出本机</span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="loginDialogOpen"
        class="sso-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="云乐坊账号登录"
        @click.self="closeLoginDialog"
      >
        <section class="sso-dialog" aria-labelledby="sso-dialog-title">
          <header class="sso-dialog-header">
            <span class="sso-dialog-mark" aria-hidden="true">🧧</span>
            <div>
              <strong id="sso-dialog-title" class="font-zmx">云乐坊账号</strong>
              <span>登录后回到 AI 春联</span>
            </div>
            <button type="button" class="sso-close" aria-label="关闭登录窗口" @click="closeLoginDialog">
              <span class="i-ri-close-line" />
            </button>
          </header>

          <div class="sso-frame-shell">
            <iframe
              v-if="loginFrameUrl"
              class="sso-frame"
              :src="loginFrameUrl"
              title="云乐坊账号登录"
              referrerpolicy="origin"
            />
          </div>

          <footer class="sso-dialog-footer">
            <span v-if="userStore.error" class="sso-error">{{ userStore.error }}</span>
            <span v-else class="sso-hint">要让 www.yunle.fun 也保持登录，请用新窗口。</span>
            <button type="button" class="font-zmx sso-window-button" @click="loginInWindow">
              <span class="i-ri-external-link-line" />
              <span>新窗口登录</span>
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
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

.sso-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: radial-gradient(circle at 50% 18%, rgba(255, 219, 142, 0.18), transparent 28rem), rgba(35, 13, 10, 0.52);
  backdrop-filter: blur(12px);
}

.sso-dialog {
  width: min(100%, 31rem);
  max-height: min(46rem, calc(100vh - 2rem));
  display: grid;
  grid-template-rows: auto minmax(22rem, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgba(126, 36, 23, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(126, 36, 23, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(126, 36, 23, 0.05) 1px, transparent 1px), #fff8ec;
  background-size:
    18px 18px,
    18px 18px,
    auto;
  box-shadow: 0 28px 80px rgba(40, 14, 10, 0.28);
}

.sso-dialog-header,
.sso-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
}

.sso-dialog-header {
  border-bottom: 1px solid rgba(126, 36, 23, 0.12);
  background: linear-gradient(180deg, rgba(255, 243, 212, 0.92), rgba(255, 248, 236, 0.8));
}

.sso-dialog-mark {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(179, 38, 30, 0.24);
  border-radius: 8px;
  background: linear-gradient(145deg, #fff3d4, #f6cf83);
  box-shadow:
    inset 0 0 0 3px rgba(255, 255, 255, 0.35),
    0 12px 28px rgba(109, 24, 18, 0.12);
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  font-size: 2rem;
  line-height: 1;
}

.sso-dialog-header div {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.sso-dialog-header strong {
  color: #a9231b;
  font-size: 1.65rem;
  font-weight: 400;
  line-height: 1;
}

.sso-dialog-header span,
.sso-hint {
  color: rgba(59, 23, 17, 0.62);
  font-size: 0.82rem;
}

.sso-hint {
  min-width: 0;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.sso-close {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #3b1711;
}

.sso-close:hover {
  background: rgba(179, 38, 30, 0.08);
  color: #a9231b;
}

.sso-frame-shell {
  min-height: 32rem;
  padding: 0.6rem;
  background: linear-gradient(180deg, rgba(255, 253, 247, 0.74), rgba(255, 243, 212, 0.54)), #fff8ec;
}

.sso-frame {
  width: 100%;
  height: 100%;
  min-height: 30.8rem;
  overflow: hidden;
  border: 1px solid rgba(126, 36, 23, 0.12);
  border-radius: 6px;
  background: #fff;
}

.sso-dialog-footer {
  border-top: 1px solid rgba(126, 36, 23, 0.12);
  background: rgba(255, 253, 247, 0.66);
}

.sso-error {
  color: #a9231b;
  font-size: 0.82rem;
  font-weight: 700;
}

.sso-window-button {
  min-height: 2.5rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(255, 220, 137, 0.5);
  border-radius: 999px;
  background: #b3261e;
  color: #fff2c7;
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0;
  box-shadow: 0 10px 24px rgba(179, 38, 30, 0.18);
}

.sso-window-button:hover {
  border-color: rgba(179, 38, 30, 0.3);
  background: #a9231b;
  color: #fff7df;
}

.dark .sso-overlay {
  background: rgba(7, 5, 6, 0.62);
}

.dark .sso-dialog {
  border-color: rgba(255, 219, 142, 0.16);
  background:
    linear-gradient(90deg, rgba(255, 219, 142, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 219, 142, 0.04) 1px, transparent 1px), #231414;
  background-size:
    18px 18px,
    18px 18px,
    auto;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46);
}

.dark .sso-dialog-header {
  background: linear-gradient(180deg, rgba(48, 24, 22, 0.96), rgba(35, 20, 20, 0.82));
}

.dark .sso-dialog-header,
.dark .sso-dialog-footer {
  border-color: rgba(255, 219, 142, 0.13);
}

.dark .sso-close,
.dark .sso-window-button {
  color: #fff4d6;
}

.dark .sso-dialog-header strong {
  color: #ffcf72;
}

.dark .sso-dialog-header span,
.dark .sso-hint {
  color: rgba(255, 244, 214, 0.64);
}

.dark .sso-close:hover {
  color: #ffdb8e;
}

.dark .sso-frame-shell,
.dark .sso-dialog-footer {
  background: rgba(25, 17, 18, 0.68);
}

.dark .sso-frame {
  border-color: rgba(255, 219, 142, 0.12);
  background: #170f12;
}

.dark .sso-window-button {
  border-color: rgba(255, 219, 142, 0.32);
  background: #d93c32;
}

.dark .sso-window-button:hover {
  background: #bf3028;
  color: #fff7df;
}

@media (max-width: 640px) {
  .account-name,
  .account-chevron {
    display: none;
  }

  .account-trigger {
    padding-right: 0.25rem;
  }

  .sso-overlay {
    padding: 0.5rem;
  }

  .sso-dialog {
    max-height: calc(100vh - 1rem);
    grid-template-rows: auto minmax(24rem, 1fr) auto;
  }

  .sso-frame-shell {
    min-height: 28rem;
    padding: 0.45rem;
  }

  .sso-frame {
    min-height: 27rem;
  }

  .sso-dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .sso-window-button {
    justify-content: center;
  }
}
</style>
