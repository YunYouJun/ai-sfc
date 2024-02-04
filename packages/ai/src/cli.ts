import consola from 'consola'
import { getCompletion, getCouplets } from './api'

export async function main() {
  consola.start('Starting chat with OpenAI')
  const choices = await getCompletion('Say this is a test')
  consola.info(choices)

  const data = await getCouplets('春眠不觉晓')
  consola.info(data)
}

main()
