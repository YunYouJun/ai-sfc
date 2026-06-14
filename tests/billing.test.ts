import { describe, expect, it, vi } from 'vitest'
import { runPaidGeneration } from '../packages/server/billing'

const couplet = { 上联: '春风入户', 下联: '喜气盈门', 横批: '迎春纳福', 总结: '福' }

function makeDeps(overrides: Partial<Parameters<typeof runPaidGeneration>[1]> = {}) {
  return {
    verifyToken: vi.fn(async () => ({ id: 'u1' })),
    deduct: vi.fn(async () => ({ balance: 9, deduped: false })),
    refund: vi.fn(async () => {}),
    generate: vi.fn(async () => couplet),
    ...overrides,
  }
}

const base = { token: 'tok', prompt: '家人平安', bizId: 'biz-1', cost: 1 }

describe('runPaidGeneration', () => {
  it('无 token → 401，不扣费不生成', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration({ ...base, token: null }, deps)
    expect(res).toEqual({ ok: false, statusCode: 401, message: expect.stringContaining('登录') })
    expect(deps.deduct).not.toHaveBeenCalled()
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it('无效 token → 401，不扣费', async () => {
    const deps = makeDeps({ verifyToken: vi.fn(async () => null) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 401 })
    expect(deps.deduct).not.toHaveBeenCalled()
  })

  it('余额不足（deduct 抛错）→ 402，不生成不退款', async () => {
    const deps = makeDeps({ deduct: vi.fn(() => Promise.reject(new Error('云币余额不足'))) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toEqual({ ok: false, statusCode: 402, message: '云币余额不足' })
    expect(deps.generate).not.toHaveBeenCalled()
    expect(deps.refund).not.toHaveBeenCalled()
  })

  it('成功 → 返回春联与余额；预扣按 userId+bizId，不退款', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration(base, deps)
    expect(res).toEqual({ ok: true, couplets: couplet, balance: 9 })
    expect(deps.deduct).toHaveBeenCalledWith({ userId: 'u1', amount: 1, bizId: 'biz-1' })
    expect(deps.refund).not.toHaveBeenCalled()
  })

  it('生成返回空 → 退款 + 502', async () => {
    const deps = makeDeps({ generate: vi.fn(async () => undefined) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 502 })
    expect(deps.refund).toHaveBeenCalledWith({ userId: 'u1', amount: 1, refId: 'biz-1' })
  })

  it('生成抛错 → 退款 + 502', async () => {
    const deps = makeDeps({ generate: vi.fn(() => Promise.reject(new Error('model down'))) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 502 })
    expect(deps.refund).toHaveBeenCalledTimes(1)
  })

  it('退款本身失败也不影响给用户的 502', async () => {
    const deps = makeDeps({
      generate: vi.fn(async () => undefined),
      refund: vi.fn(() => Promise.reject(new Error('refund failed'))),
    })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 502 })
  })
})
