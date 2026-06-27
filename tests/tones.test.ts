import { describe, expect, it } from 'vitest'
import { analyzeCouplet, toneOf } from '../packages/ai/src/tones'

describe('toneOf', () => {
  it('一二声为平、三四声为仄（中华新韵）', () => {
    expect(toneOf('春').tone).toBe('平') // chun1
    expect(toneOf('人').tone).toBe('平') // ren2
    expect(toneOf('海').tone).toBe('仄') // hai3
    expect(toneOf('地').tone).toBe('仄') // di4
  })

  it('非汉字 tone 为 null', () => {
    expect(toneOf('，').tone).toBeNull()
    expect(toneOf('A').tone).toBeNull()
  })

  it('返回去掉声调数字的拼音', () => {
    expect(toneOf('春').py).toBe('chun')
  })
})

describe('analyzeCouplet', () => {
  it('逐字平仄数量与字数一致', () => {
    const r = analyzeCouplet('春回大地', '福满人间')
    expect(r.上联).toHaveLength(4)
    expect(r.下联).toHaveLength(4)
    for (const c of r.上联)
      expect(c.tone === '平' || c.tone === '仄' || c.tone === null).toBe(true)
  })

  it('上联仄收、下联平收 → 尾字合律', () => {
    // 末字：地(di4 仄) / 天(tian1 平)
    const r = analyzeCouplet('风调雨顺地', '国泰民安天')
    expect(r.尾字合律).toBe(true)
  })

  it('上联平收、下联仄收 → 尾字出律', () => {
    const r = analyzeCouplet('国泰民安天', '风调雨顺地')
    expect(r.尾字合律).toBe(false)
    expect(r.结论).toContain('尾字')
  })

  it('输出合律/对仗度/结论等字段且取值合理', () => {
    const r = analyzeCouplet('天增岁月人增寿', '春满乾坤福满堂')
    expect(typeof r.合律).toBe('boolean')
    expect(r.结论.length).toBeGreaterThan(0)
    expect(r.对仗度).toBeGreaterThanOrEqual(0)
    expect(r.对仗度).toBeLessThanOrEqual(1)
  })
})
