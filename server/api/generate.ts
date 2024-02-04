import type { SprintFestivalCouplets } from '~/packages/ai/src'
import { getCouplets } from '~/packages/ai/src'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const data = await getCouplets(query.prompt as string)
  const { content } = data

  let unWrapperContent = content || ''
  const startPos = unWrapperContent.indexOf('{')
  const endPos = unWrapperContent.lastIndexOf('}')

  if (startPos === -1 || endPos === -1) {
    // eslint-disable-next-line no-console
    console.log(content)
    return
  }

  unWrapperContent = unWrapperContent.slice(startPos, endPos + 1)
  unWrapperContent = (unWrapperContent || '{}')?.replace('```json\n', '').replace('```', '')
  let coupletData: SprintFestivalCouplets | undefined
  try {
    coupletData = JSON.parse(unWrapperContent) as SprintFestivalCouplets
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(content)
    console.error(e)
  }

  return coupletData
})
