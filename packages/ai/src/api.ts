import consola from 'consola'
import { baseChatCompletionCreateParams, baseModel, openai } from './config'

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

export async function getCouplets(couplet: string) {
  const tooltip = [
    '请为我生成一组春联，包含上联、下联各一句，每句字数在五到十三字之间，并附上一个恰当的横批。',
    '并给出一个字总结。',
    '尽量不要使用生僻字。',
    '以下述 JSON 给出：',
    `export interface SprintFestivalCouplets {
  上联: string
  下联: string
  横批: string
  总结: string
}`,
  ]

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: tooltip.join('\n'),
      },
      // { role: 'user', content: couplet },
    ],
    model: 'deepseek-chat',
    max_tokens: 300,
    // stream: true
  })

  consola.debug(chatCompletion)
  return chatCompletion.choices[0].message
}
