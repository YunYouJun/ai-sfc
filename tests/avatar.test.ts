import { describe, expect, it, vi } from 'vitest'
import { resolveAvatarUrl } from '../app/utils/avatar'

describe('avatar helpers', () => {
  it('应该刷新旧的 CloudBase 头像地址', async () => {
    const bucket = '7975-yunlefun-8g7ybcxc7345c490-1325586649'
    const legacyUrl = `https://${bucket}.tcb.qcloud.la/avatars/user-1.jpg`
    const fileID = `cloud://yunlefun-8g7ybcxc7345c490.${bucket}/avatars/user-1.jpg`
    const freshUrl = 'https://cdn.example.com/avatars/user-1.jpg?token=fresh'
    const getTempFileURL = vi.fn().mockResolvedValue({
      fileList: [{ fileID, tempFileURL: freshUrl }],
    })

    await expect(resolveAvatarUrl(
      legacyUrl,
      'yunlefun-8g7ybcxc7345c490',
      getTempFileURL,
    )).resolves.toBe(freshUrl)
    expect(getTempFileURL).toHaveBeenCalledWith({ fileList: [fileID] })
  })

  it('应该直接使用第三方头像地址', async () => {
    const url = 'https://avatars.githubusercontent.com/u/1?v=4'
    const getTempFileURL = vi.fn()

    await expect(resolveAvatarUrl(
      url,
      'yunlefun-8g7ybcxc7345c490',
      getTempFileURL,
    )).resolves.toBe(url)
    expect(getTempFileURL).not.toHaveBeenCalled()
  })
})
