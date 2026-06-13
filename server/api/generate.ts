import { getCoupletDataByPrompt } from '../../packages/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const coupletData = await getCoupletDataByPrompt(query.prompt as string)
  return coupletData
})
