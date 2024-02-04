import { baseChatCompletionCreateParams, baseModel, openai } from './config'

export async function getCompletion(msg: string) {
  const chatCompletion = await openai.chat.completions.create({
    ...baseChatCompletionCreateParams,
    messages: [{ role: 'user', content: msg }],
    model: baseModel,
  })

  return chatCompletion.choices
}

export async function getCouplets(couplet: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: '你是一个诗人，擅长写对联，我将给你一个上联，你回答一个下联。' },
      { role: 'user', content: couplet },
    ],
    model: 'deepseek-chat',
    max_tokens: 300,
    // stream: true
  })

  console.log(chatCompletion)
  return chatCompletion.choices[0].message
}
