import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateCoupletsDirect } from '../app/utils/generate-local'

const provider = { baseURL: 'https://api.example.com/v1', model: 'my-model', apiKey: 'sk-test' }

function mockFetch(response: { ok?: boolean, status?: number, body?: unknown, text?: string }) {
  const status = response.status ?? 200
  const fn = vi.fn(async () => ({
    ok: response.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => response.body,
    text: async () => response.text ?? '',
  }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generateCoupletsDirect', () => {
  it('成功时解析模型返回，并直连用户填写的 baseURL（带 Bearer token）', async () => {
    const fetchMock = mockFetch({
      body: { choices: [{ message: { content: '{"上联":"a","下联":"b","横批":"c","总结":"福"}' } }] },
    })

    const result = await generateCoupletsDirect('家人平安', provider)
    expect(result).toEqual({ 上联: 'a', 下联: 'b', 横批: 'c', 总结: '福' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    expect(JSON.parse(init.body as string).model).toBe('my-model')
  })

  it('非 2xx 状态返回兜底文案并携带 error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch({ status: 401, text: 'unauthorized' })

    const result = await generateCoupletsDirect('x', provider)
    expect(result.error).toContain('401')
    expect(result.上联).toBe('网络出错网络差')
  })

  it('返回内容无法解析为春联时返回兜底文案', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch({ body: { choices: [{ message: { content: '这不是 JSON' } }] } })

    const result = await generateCoupletsDirect('x', provider)
    expect(result.error).toBeTruthy()
    expect(result.横批).toBe('掉线断网')
  })
})
