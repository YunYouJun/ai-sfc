import { describe, expect, it } from 'vitest'
import { withTimeout } from '../app/utils/promise-timeout'

describe('promise timeout', () => {
  it('returns the operation result before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50, 'late')).resolves.toBe('ok')
  })

  it('preserves the original rejection', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('original')), 50, 'late'),
    ).rejects.toThrow('original')
  })

  it('rejects an operation that never settles', async () => {
    await expect(
      withTimeout(new Promise(() => {}), 1, 'timed out'),
    ).rejects.toThrow('timed out')
  })
})
