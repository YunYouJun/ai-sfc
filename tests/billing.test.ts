import { describe, expect, it, vi } from 'vitest'
import { runPaidGeneration } from '../packages/server/billing'

const couplet = { 上联: '春风入户', 下联: '喜气盈门', 横批: '迎春纳福', 总结: '福' }
const content = JSON.stringify(couplet)

function makeDeps(chatImpl?: Parameters<typeof runPaidGeneration>[1]['chat']) {
  return {
    chat: vi.fn(chatImpl ?? (async () => ({ ok: true as const, content, balance: 9, deduped: false }))),
  }
}

const base = { token: 'tok', prompt: '家人平安', bizId: 'biz-1' }

describe('runPaidGeneration（经 ai-gateway 单次原子调用）', () => {
  it('无 token → 401，不调网关', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration({ ...base, token: null }, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 401 })
    expect(deps.chat).not.toHaveBeenCalled()
  })

  it('网关业务码 unauthorized → 401', async () => {
    const deps = makeDeps(async () => ({ ok: false, code: 'unauthorized', message: 'x' }))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 401 })
  })

  it('网关业务码 insufficient → 402', async () => {
    const deps = makeDeps(async () => ({ ok: false, code: 'insufficient', message: '余额不足' }))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 402 })
  })

  it('网关业务码 ai_failed → 502', async () => {
    const deps = makeDeps(async () => ({ ok: false, code: 'ai_failed', message: '失败' }))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 502 })
  })

  it('传输层鉴权异常（status 401）→ 401', async () => {
    const deps = makeDeps(() => Promise.reject(Object.assign(new Error('Unauthorized'), { status: 401 })))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 401 })
  })

  it('传输层其他异常 → 502', async () => {
    const deps = makeDeps(() => Promise.reject(new Error('network down')))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 502 })
  })

  it('返回内容无法解析为春联 → 502', async () => {
    const deps = makeDeps(async () => ({ ok: true, content: '不是 JSON', balance: 9, deduped: false }))
    expect(await runPaidGeneration(base, deps)).toMatchObject({ ok: false, statusCode: 502 })
  })

  it('成功 → 解析春联并返回余额，且把 prompt 构造成 messages 传给网关', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration(base, deps)
    expect(res).toEqual({ ok: true, couplets: couplet, balance: 9 })
    const [token, messages, bizId] = deps.chat.mock.calls[0]
    expect(token).toBe('tok')
    expect(bizId).toBe('biz-1')
    expect(messages[0]).toMatchObject({ role: 'system' })
    expect(messages.at(-1)).toMatchObject({ role: 'user', content: expect.stringContaining('家人平安') })
  })
})
