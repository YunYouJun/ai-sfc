import type { AiProviderRequest } from '~/utils/ai-provider'
import { useStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  createDefaultAiProviderSettings,
  defaultAiBaseURL,
  defaultAiModel,
  readProviderString,
  sanitizeAiProviderRequest,
} from '~/utils/ai-provider'

const ns = 'ai-sfc'

export const useAiSettingsStore = defineStore('ai-settings', () => {
  const settings = useStorage(`${ns}:ai-provider`, createDefaultAiProviderSettings(), undefined, {
    mergeDefaults: true,
  })

  const requestProvider = computed(() => sanitizeAiProviderRequest(settings.value))
  const hasToken = computed(() => !!requestProvider.value.apiKey)

  /**
   * 用于浏览器直连：baseURL/model 缺省回落默认值，apiKey 原样（可能为空）。
   */
  const resolvedProvider = computed<AiProviderRequest>(() => ({
    baseURL: readProviderString(settings.value.baseURL) || defaultAiBaseURL,
    model: readProviderString(settings.value.model) || defaultAiModel,
    apiKey: readProviderString(settings.value.apiKey),
  }))

  function reset() {
    settings.value = createDefaultAiProviderSettings()
  }

  return {
    settings,
    requestProvider,
    resolvedProvider,
    hasToken,
    reset,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAiSettingsStore, import.meta.hot))
