import { createOpenAIInstance } from '../../packages/ai/src/config'
import { getCoupletDataByPrompt } from '../../packages/server'

export async function onRequest({ request, env }: { request: Request, env: Record<string, string> }) {
  createOpenAIInstance({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.AI_SERVICE_URL,
    model: env.MODEL_NAME,
  })

  const url = new URL(request.url)
  const prompt = url.searchParams.get('prompt')
  // return new Response(json)
  const coupletData = await getCoupletDataByPrompt(prompt || '')
  return new Response(JSON.stringify(coupletData || {}))
}
