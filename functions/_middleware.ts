interface PagesMiddlewareContext {
  request: Request
  next: () => Promise<Response>
}

const PRIMARY_ORIGIN = 'https://ai-sfc.yunle.fun'

export function shouldRedirectLegacyHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'ai-sfc.yunyoujun.cn'
    || host === 'ai-sfc.pages.dev'
    || host.endsWith('.ai-sfc.pages.dev')
}

/** Cloudflare Pages edge redirect; 308 preserves method/body for legacy API calls. */
export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
  const source = new URL(context.request.url)
  if (!shouldRedirectLegacyHost(source.hostname))
    return context.next()

  const target = new URL(`${source.pathname}${source.search}`, PRIMARY_ORIGIN)
  return Response.redirect(target, 308)
}
