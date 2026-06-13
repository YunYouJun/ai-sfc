import { describe, expect, it } from 'vitest'
import { extractJsonObject, parseCoupletContent } from '../packages/server/couplets'

describe('couplet response parsing', () => {
  it('应该从模型说明文本中提取 JSON 对象', () => {
    const content = '当然可以：\n{"上联":"春来花满院","下联":"福到喜盈门","横批":"迎春纳福","总结":"福"}\n祝好'

    expect(extractJsonObject(content)).toBe('{"上联":"春来花满院","下联":"福到喜盈门","横批":"迎春纳福","总结":"福"}')
  })

  it('应该解析 fenced JSON 并返回春联数据', () => {
    const content = '```json\n{"上联":"风调雨顺","下联":"国泰民安","横批":"四海升平","总结":"安"}\n```'

    expect(parseCoupletContent(content)).toEqual({
      上联: '风调雨顺',
      下联: '国泰民安',
      横批: '四海升平',
      总结: '安',
    })
  })

  it('应该移除上下联尾部中文逗号和句号', () => {
    const content = '{"上联":"春风入户添祥瑞，","下联":"喜气临门纳吉祥。","横批":"春满人间","总结":"喜"}'

    expect(parseCoupletContent(content)).toEqual({
      上联: '春风入户添祥瑞',
      下联: '喜气临门纳吉祥',
      横批: '春满人间',
      总结: '喜',
    })
  })

  it('应该在没有 JSON 对象时返回 undefined', () => {
    expect(parseCoupletContent('春联生成失败，请稍后再试')).toBeUndefined()
  })

  it('应该在 JSON 格式错误时抛出解析错误', () => {
    expect(() => parseCoupletContent('{"上联":"春来",}')).toThrow()
  })
})
