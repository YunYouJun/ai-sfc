import consola from 'consola'
import type OpenAI from 'openai'
import { baseChatCompletionCreateParams, baseModel, openai } from './config'

// TODO: pass params
import { config } from '~/config'

export async function getCompletion(msg: string) {
  const chatCompletion = await openai.chat.completions.create({
    ...baseChatCompletionCreateParams,
    messages: [{ role: 'user', content: msg }],
    model: baseModel,
  })

  return chatCompletion.choices
}

export interface SprintFestivalCouplets {
  上联: string
  下联: string
  横批: string
  总结: string
}

export async function getCouplets(prompt: string) {
  /**
   * 限制输入长度
   */
  prompt = prompt.trim().slice(0, config.inputMaxLength)

  const tooltip = [
    '请根据我的提示生成一组春联，包含上联、下联各一句，每句字数在五到十三字之间，上下联字数相同，并附上一个恰当的不超过五个字的横批。',
    '并给出一个字总结。',
    '不需要标点符号，不要使用生僻字。',
    `格式类型：{
  "上联": "",
  "下联": "",
  "横批": "",
  "总结": ""
}`,
    '直接给出可以被 JSON.parse 解析的字符串，不要解释内容。',
  ]

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: tooltip.join('\n'),
    },
  ]

  if (prompt)
    messages.push({ role: 'user', content: `我的提示是：${prompt}` })

  const chatCompletion = await openai.chat.completions.create({
    ...baseChatCompletionCreateParams,
    messages,
    model: baseModel,
    // stream: true
  })

  consola.debug(chatCompletion)
  return chatCompletion.choices[0].message
}
