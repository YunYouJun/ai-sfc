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

    // remove the last comma and period
    if (coupletData['上联'].endsWith('，') && coupletData['下联'].endsWith('。')) {
      coupletData['下联'] = coupletData['下联'].slice(0, -1)
      coupletData['上联'] = coupletData['上联'].slice(0, -1)
    }
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(content)
    console.error(e)
  }

  return coupletData
})
