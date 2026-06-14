/**
 * 同构春联逻辑：浏览器与服务端共用同一套 prompt 构造与解析。
 *
 * ⚠️ 本文件必须保持「纯」：不要 import `openai`/`consola`/`./cli` 等带 Node 依赖的模块，
 * 以便浏览器侧通过 `~~/packages/ai/src/couplets` 直接引用而不污染前端 bundle。
 */

export interface SprintFestivalCouplets {
  上联: string
  下联: string
  横批: string
  总结: string
}

export interface CoupletMessage {
  role: 'system' | 'user'
  content: string
}

/** 默认输入截断长度（与 app/config 的 inputMaxLength 对齐） */
export const defaultCoupletInputMaxLength = 200

/** 春联生成系统提示词（尽量少的 token） */
export const coupletSystemPrompt = `
请根据我的提示生成一组春联，包含上联、下联各一句，每句字数在五到十三字之间，上下联字数相同，并附上一个恰当的不超过五个字的横批。
并给出一个字总结。
不要使用生僻字和标点符号。
格式类型：{
  "上联": "",
  "下联": "",
  "横批": "",
  "总结": ""
}
直接给出可以被 JSON.parse 解析的字符串，不需要解释内容。`

/**
 * 构造春联生成所需的消息列表。
 * @param prompt 用户提示词
 * @param maxLength 输入截断长度
 */
export function buildCoupletMessages(prompt = '', maxLength = defaultCoupletInputMaxLength): CoupletMessage[] {
  const trimmed = prompt.trim().slice(0, maxLength)

  const messages: CoupletMessage[] = [
    { role: 'system', content: coupletSystemPrompt },
  ]

  if (trimmed)
    messages.push({ role: 'user', content: `我的提示是：${trimmed}` })

  return messages
}

/** 从模型返回内容中提取首个 JSON 对象字符串 */
export function extractJsonObject(content: string) {
  const normalized = content.replace('```json\n', '').replace('```', '')
  const startPos = normalized.indexOf('{')
  const endPos = normalized.lastIndexOf('}')

  if (startPos === -1 || endPos === -1 || endPos < startPos)
    return ''

  return normalized.slice(startPos, endPos + 1)
}

/** 解析模型返回内容为春联对象；无法解析时返回 undefined */
export function parseCoupletContent(content: string | null | undefined) {
  const jsonContent = extractJsonObject(content || '')
  if (!jsonContent)
    return undefined

  const coupletData = JSON.parse(jsonContent) as SprintFestivalCouplets

  if (coupletData['上联'].endsWith('，') && coupletData['下联'].endsWith('。')) {
    coupletData['上联'] = coupletData['上联'].slice(0, -1)
    coupletData['下联'] = coupletData['下联'].slice(0, -1)
  }

  return coupletData
}
