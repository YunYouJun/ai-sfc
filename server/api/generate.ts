import type { SprintFestivalCouplets } from '~/packages/ai/src'
import { getCouplets } from '~/packages/ai/src'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const data = await getCouplets(query.prompt as string)
  const { content } = data

  const unwrapperContent = (content || '{}')?.replace('```json\n', '').replace('```', '')
  let coupletData: SprintFestivalCouplets | undefined
  try {
    coupletData = JSON.parse(unwrapperContent) as SprintFestivalCouplets
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(content)
    console.error(e)
  }

  return coupletData
})
