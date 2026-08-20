import { beforeEach, describe, expect, it, vi } from 'vitest'

import { aiChatViaRuntime } from '../packages/server/runtime'

const h = vi.hoisted(() => ({ fetch: vi.fn() }))

vi.mock('ofetch', () => ({ $fetch: h.fetch }))

describe('aI Runtime transport', () => {
  beforeEach(() => h.fetch.mockReset())

  it('sends the unified chat contract and returns the authoritative settled balance', async () => {
    h.fetch.mockResolvedValueOnce({
      content: '春风入户',
      asset: { unit: 'coin', available: 9 },
    })

    await expect(aiChatViaRuntime(
      'https://runtime.example/',
      'access_token',
      {
        applicationId: 'ai-sfc',
        messages: [{ role: 'user', content: 'hello' }],
        idempotencyKey: 'request_fixture_1',
        origin: 'https://ai-sfc.yunle.fun',
      },
    )).resolves.toEqual({ ok: true, content: '春风入户', balance: 9 })

    expect(h.fetch).toHaveBeenNthCalledWith(1, 'https://runtime.example/ai/v1/chat', expect.objectContaining({
      headers: expect.objectContaining({
        'Idempotency-Key': 'request_fixture_1',
        'Origin': 'https://ai-sfc.yunle.fun',
        'X-Application-Id': 'ai-sfc',
      }),
      body: {
        applicationId: 'ai-sfc',
        messages: [{ role: 'user', content: 'hello' }],
      },
    }))
  })

  it('maps insufficient Runtime assets without issuing a second model call', async () => {
    h.fetch.mockRejectedValueOnce({
      status: 402,
      data: { error: { code: 'COIN_INSUFFICIENT', message: '云币余额不足' } },
    })

    await expect(aiChatViaRuntime('https://runtime.example', 'token', {
      applicationId: 'ai-sfc',
      messages: [{ role: 'user', content: 'hello' }],
      idempotencyKey: 'request_fixture_2',
      origin: 'https://ai-sfc.yunle.fun',
    })).resolves.toEqual({ ok: false, code: 'insufficient', message: '云币余额不足' })
    expect(h.fetch).toHaveBeenCalledTimes(1)
  })
})
