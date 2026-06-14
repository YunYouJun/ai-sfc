import { describe, expect, it, vi } from 'vitest'
import { runPaidGeneration } from '../packages/server/billing'

const couplet = { 上联: '春风入户', 下联: '喜气盈门', 横批: '迎春纳福', 总结: '福' }

function makeDeps(overrides: Partial<Parameters<typeof runPaidGeneration>[1]> = {}) {
  return {
    getBalance: vi.fn(async () => 10),
    generate: vi.fn(async () => couplet),
    deduct: vi.fn(async () => ({ balance: 9 })),
    ...overrides,
  }
}

const base = { token: 'tok', prompt: '家人平安', bizId: 'biz-1', cost: 1 }

describe('runPaidGeneration', () => {
  it('无 token → 401，不查余额不生成', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration({ ...base, token: null }, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 401 })
    expect(deps.getBalance).not.toHaveBeenCalled()
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it('token 无效（查余额抛错）→ 401，不生成', async () => {
    const deps = makeDeps({ getBalance: vi.fn(() => Promise.reject(new Error('401'))) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 401 })
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it('余额不足 → 402，不生成不扣费', async () => {
    const deps = makeDeps({ getBalance: vi.fn(async () => 0) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 402 })
    expect(deps.generate).not.toHaveBeenCalled()
    expect(deps.deduct).not.toHaveBeenCalled()
  })

  it('生成返回空 → 502，不扣费', async () => {
    const deps = makeDeps({ generate: vi.fn(async () => undefined) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 502 })
    expect(deps.deduct).not.toHaveBeenCalled()
  })

  it('生成抛错 → 502，不扣费', async () => {
    const deps = makeDeps({ generate: vi.fn(() => Promise.reject(new Error('model down'))) })
    const res = await runPaidGeneration(base, deps)
    expect(res).toMatchObject({ ok: false, statusCode: 502 })
    expect(deps.deduct).not.toHaveBeenCalled()
  })

  it('成功 → 生成后扣费、返回新余额', async () => {
    const deps = makeDeps()
    const res = await runPaidGeneration(base, deps)
    expect(res).toEqual({ ok: true, couplets: couplet, balance: 9 })
    expect(deps.deduct).toHaveBeenCalledWith('tok', { amount: 1, bizId: 'biz-1' })
  })

  it('扣费失败也返回已生成结果（余额回退本地估算）', async () => {
    const deps = makeDeps({
      getBalance: vi.fn(async () => 5),
      deduct: vi.fn(() => Promise.reject(new Error('deduct failed'))),
    })
    const res = await runPaidGeneration(base, deps)
    expect(res).toEqual({ ok: true, couplets: couplet, balance: 4 })
  })
})
