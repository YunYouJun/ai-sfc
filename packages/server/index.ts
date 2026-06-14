import type { SprintFestivalCouplets } from '~~/packages/ai/src'
import type { AiClientConfig } from '~~/packages/ai/src/config'
import { getCouplets } from '~~/packages/ai/src'
import { parseCoupletContent } from './couplets'

export { extractJsonObject, parseCoupletContent } from './couplets'

export async function getCoupletDataByPrompt(prompt: string, provider?: AiClientConfig) {
  const data = await getCouplets(prompt, provider)
  if (!data)
    return

  const { content } = data
  let coupletData: SprintFestivalCouplets | undefined
  try {
    coupletData = parseCoupletContent(content)
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(content)
    console.error(e)
  }
  return coupletData
}
