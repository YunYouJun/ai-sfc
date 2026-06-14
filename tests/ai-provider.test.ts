import { describe, expect, it } from 'vitest'
import {
  createDefaultAiProviderSettings,
  defaultAiBaseURL,
  defaultAiModel,
  sanitizeAiProviderRequest,
} from '../app/utils/ai-provider'

describe('ai provider settings', () => {
  it('应该提供默认 DeepSeek 兼容配置', () => {
    expect(createDefaultAiProviderSettings()).toEqual({
      apiKey: '',
      baseURL: defaultAiBaseURL,
      model: defaultAiModel,
    })
  })

  it('应该清理输入并移除空 token', () => {
    expect(sanitizeAiProviderRequest({
      apiKey: '   ',
      baseURL: ' https://api.example.com/v1 ',
      model: ' custom-model ',
    })).toEqual({
      baseURL: 'https://api.example.com/v1',
      model: 'custom-model',
    })
  })

  it('应该拒绝非对象配置', () => {
    expect(sanitizeAiProviderRequest(null)).toEqual({})
    expect(sanitizeAiProviderRequest('bad')).toEqual({})
  })
})
