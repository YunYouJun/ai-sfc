/**
 * generate couplets
 */
export async function apiGenerate(params: {
  prompt: string
}) {
  try {
    const data = await $fetch('/api/generate', {
      query: params,
    })
    return data
  }
  catch (error: any) {
    console.error('apiGenerate', error)
    return {
      error: error.message,
      上联: '网络出错网络差',
      下联: '热门火爆排队多',
      横批: '掉线断网',
      总结: '寄',
    }
  }
}
