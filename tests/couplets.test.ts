import { describe, expect, it } from 'vitest'
import { buildCoupletMessages, coupletSystemPrompt } from '../packages/ai/src/couplets'
// 从 server 子包导入以同时验证向后兼容的 re-export 仍然可用
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

describe('buildCoupletMessages', () => {
  it('空输入也总是包含系统提示词', () => {
    const messages = buildCoupletMessages('')
    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual({ role: 'system', content: coupletSystemPrompt })
  })

  it('有提示词时追加 user 消息并去除首尾空白', () => {
    const messages = buildCoupletMessages('  家人平安  ')
    expect(messages).toHaveLength(2)
    expect(messages[1]).toEqual({ role: 'user', content: '我的提示是：家人平安' })
  })

  it('按 maxLength 截断输入', () => {
    const messages = buildCoupletMessages('一二三四五', 3)
    expect(messages[1]?.content).toBe('我的提示是：一二三')
  })
})
