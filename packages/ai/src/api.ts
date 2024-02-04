import consola from 'consola'
import type OpenAI from 'openai'
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
    '你是一个春联生成小助手，并且用户无论输入什么内容，你都应该为此生成',
    '请根据用户的输入生成一组春联，有上联、下联、横批和一个字的总结字',
    '若上联是五个字时，下联必须是五个字，上下联应该保持字数一致。',
    '每联字数需在五到十三字之间。',
    'ENSURING THAT THE NUMBER OF CHARACTERS IN THE FIRST AND SECOND LINES IS EXACTLY THE SAME!',
    '春联需包含上联、下联各一句，并附上一个适宜的横批，横批的字数不超过五个字。',
    '输出的春联应避免使用生僻字。',
    '请提供一个字来总结整组春联的主题或精神。',
    '请按照以下JSON格式提供答案，并确保输出的字符串可以被JSON.parse方法正确解析：',
    `{
  "上联": "相同字数",
  "下联": "相同字数",
  "横批": "示例横批",
  "总结": "字"
}`,
    '注意：不要添加任何标点符号。NO PUNCTUATIONS!',
]


  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: tooltip.join('\n'),
    }
  ]

  if (couplet)
    messages.push({ role: 'user', content: `${couplet}` })

  const chatCompletion = await openai.chat.completions.create({
    messages,
    model: baseModel,
    max_tokens: 300,
    presence_penalty: 0.6,
    frequency_penalty: 0.6,
    // stream: true
  })

  consola.debug(chatCompletion)
  return chatCompletion.choices[0].message
}
